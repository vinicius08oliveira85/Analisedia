import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails } from '../types';

interface SportsEvent {
  '@type': string;
  sport: string;
  name: string;
  homeTeam: {
    '@type': string;
    name: string;
    image: string;
    url: string;
  };
  awayTeam: {
    '@type': string;
    name: string;
    image: string;
    url: string;
  };
  location: {
    '@type': string;
    name: string;
  };
  startDate: string;
  endDate: string;
  url: string;
}

interface SchemaData {
  '@context': string;
  '@graph': SportsEvent[];
}

// Função para extrair dados JSON do HTML
function extractMatchesFromHTML(html: string): SportsEvent[] {
  const matches: SportsEvent[] = [];
  
  // Estratégia 1: Procura por scripts com application/ld+json (mais flexível)
  // Aceita qualquer combinação de atributos antes do conteúdo JSON
  const jsonScriptRegex = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  
  while ((scriptMatch = jsonScriptRegex.exec(html)) !== null) {
    const scriptContent = scriptMatch[1];
    // Remove qualquer espaço em branco inicial/final
    const cleanedContent = scriptContent.trim();
    
    try {
      // Tenta parsear diretamente
      const data: SchemaData = JSON.parse(cleanedContent);
      
      // Verifica se tem @graph
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        const sportsEvents = data['@graph'].filter((event: any) => event['@type'] === 'SportsEvent');
        matches.push(...sportsEvents);
        continue; // Sucesso, continua para próximo script
      }
      // Se não tem @graph mas é um SportsEvent direto
      else if (data['@type'] === 'SportsEvent') {
        matches.push(data as SportsEvent);
        continue;
      }
    } catch (error) {
      // Se falhou, tenta extrair JSON do conteúdo
      try {
        // Procura por objeto JSON completo no conteúdo
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data: SchemaData = JSON.parse(jsonMatch[0]);
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            const sportsEvents = data['@graph'].filter((event: any) => event['@type'] === 'SportsEvent');
            matches.push(...sportsEvents);
            continue;
          }
        }
      } catch (e) {
        // Continua para próxima tentativa
      }
    }
  }
  
  // Estratégia 2: Se não encontrou nada, procura diretamente por JSON no HTML
  if (matches.length === 0) {
    try {
      // Procura por padrão @graph com SportsEvent
      const graphRegex = /\{"@context":"https:\/\/schema\.org\/"[^}]*"@graph":\[([\s\S]*?)\]\}/;
      const graphMatch = html.match(graphRegex);
      
      if (graphMatch) {
        // Tenta reconstruir o JSON completo
        const graphContent = graphMatch[1];
        // Verifica se há múltiplos objetos no array
        const events = graphContent.split(/\},\s*\{/);
        
        for (let i = 0; i < events.length; i++) {
          let eventStr = events[i];
          if (i > 0) eventStr = '{' + eventStr;
          if (i < events.length - 1) eventStr = eventStr + '}';
          
          try {
            const event = JSON.parse(eventStr);
            if (event['@type'] === 'SportsEvent') {
              matches.push(event);
            }
          } catch (e) {
            // Ignora eventos inválidos
          }
        }
      }
    } catch (e) {
      console.error('Erro na extração alternativa:', e);
    }
  }
  
  // Estratégia 3: Procura por qualquer objeto SportsEvent no HTML
  if (matches.length === 0) {
    try {
      const sportsEventRegex = /\{"@type":"SportsEvent"[^}]*"homeTeam":\{[^}]*"name":"([^"]+)"[^}]*\}[^}]*"awayTeam":\{[^}]*"name":"([^"]+)"[^}]*\}[^}]*\}/g;
      let eventMatch;
      
      while ((eventMatch = sportsEventRegex.exec(html)) !== null) {
        // Tenta extrair o objeto completo
        const startPos = eventMatch.index;
        let braceCount = 0;
        let jsonStr = '';
        let pos = startPos;
        
        while (pos < html.length) {
          const char = html[pos];
          jsonStr += char;
          if (char === '{') braceCount++;
          if (char === '}') {
            braceCount--;
            if (braceCount === 0) break;
          }
          pos++;
        }
        
        try {
          const event = JSON.parse(jsonStr);
          if (event['@type'] === 'SportsEvent') {
            matches.push(event);
          }
        } catch (e) {
          // Ignora
        }
      }
    } catch (e) {
      // Ignora
    }
  }
  
  return matches;
}

// Dados placeholder para campos que não estão no HTML
const placeholderData = {
  h2hData: [],
  teamAForm: [],
  teamBForm: [],
  standingsData: [],
  teamAGoalStats: {
    home: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    },
    away: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    },
    global: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    }
  },
  teamBGoalStats: {
    home: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    },
    away: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    },
    global: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    }
  },
  teamAStreaks: {
    home: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 },
    away: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 },
    global: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 }
  },
  teamBStreaks: {
    home: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 },
    away: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 },
    global: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 }
  },
  teamAOpponentAnalysis: {
    home: [],
    away: [],
    global: []
  },
  teamBOpponentAnalysis: {
    home: [],
    away: [],
    global: []
  },
  teamAGoalPatterns: {
    home: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } },
    away: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } },
    global: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } }
  },
  teamBGoalPatterns: {
    home: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } },
    away: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } },
    global: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } }
  },
  teamACorrectScores: {
    home: { ht: [], ft: [] },
    away: { ht: [], ft: [] },
    global: { ht: [], ft: [] }
  },
  teamBCorrectScores: {
    home: { ht: [], ft: [] },
    away: { ht: [], ft: [] },
    global: { ht: [], ft: [] }
  }
};

// Função para converter SportsEvent para MatchDetails
function convertToMatchDetails(event: SportsEvent): MatchDetails {
  const startDate = new Date(event.startDate);
  const dateStr = startDate.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  const timeStr = startDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Extrai competição do location name
  const competition = event.location.name.split(' - ')[1] || event.location.name;
  
  // Gera ID único baseado nos times
  const homeTeamSlug = event.homeTeam.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const awayTeamSlug = event.awayTeam.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const matchId = `${homeTeamSlug}-${awayTeamSlug}`;
  
  return {
    id: matchId,
    teamA: {
      name: event.homeTeam.name,
      logo: event.homeTeam.image
    },
    teamB: {
      name: event.awayTeam.name,
      logo: event.awayTeam.image
    },
    matchInfo: {
      date: dateStr,
      time: timeStr,
      competition: competition
    },
    ...placeholderData
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Retorna os jogos processados
      // Em produção, você pode salvar em um banco de dados ou cache
      return res.status(200).json({ 
        message: 'Use POST para atualizar os jogos com dados HTML',
        endpoint: '/api/matches'
      });
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      return res.status(500).json({ error: 'Erro ao buscar jogos' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { html } = req.body;

      if (!html || typeof html !== 'string') {
        return res.status(400).json({ 
          error: 'É necessário fornecer o HTML no body: { "html": "..." }' 
        });
      }

      console.log('HTML recebido, tamanho:', html.length);
      
      // Extrai os eventos do HTML
      const events = extractMatchesFromHTML(html);
      
      console.log('Eventos extraídos:', events.length);
      
      if (events.length === 0) {
        // Tenta encontrar o motivo
        const hasScript = html.includes('application/ld+json');
        const hasSportsEvent = html.includes('SportsEvent');
        const hasGraph = html.includes('@graph');
        
        return res.status(400).json({ 
          error: 'Nenhum jogo encontrado no HTML fornecido',
          debug: {
            htmlLength: html.length,
            hasScript: hasScript,
            hasSportsEvent: hasSportsEvent,
            hasGraph: hasGraph,
            sample: html.substring(0, 500) // Primeiros 500 caracteres para debug
          }
        });
      }

      // Converte para MatchDetails
      const matches = events.map(convertToMatchDetails).filter(m => m.id) as MatchDetails[];

      console.log('Matches convertidos:', matches.length);

      // Aqui você pode salvar no banco de dados (Supabase) se necessário
      // Por enquanto, apenas retorna os dados processados

      return res.status(200).json({
        success: true,
        count: matches.length,
        matches: matches,
        message: `${matches.length} jogos processados com sucesso`
      });
    } catch (error) {
      console.error('Erro ao processar jogos:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar jogos',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


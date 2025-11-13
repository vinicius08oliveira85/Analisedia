import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails, LiveMatchStatus, MatchOdds } from '../types';

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
  
  // Estratégia 1: Procura por scripts com application/ld+json
  // Aceita qualquer combinação de atributos (type=module, data-force, etc.)
  const jsonScriptRegex = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  
  while ((scriptMatch = jsonScriptRegex.exec(html)) !== null) {
    const scriptContent = scriptMatch[1].trim();
    
    if (!scriptContent) continue;
    
    try {
      // Tenta parsear diretamente
      const data: any = JSON.parse(scriptContent);
      
      // Verifica se tem @graph
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        const sportsEvents = data['@graph'].filter((event: any) => 
          event && event['@type'] === 'SportsEvent'
        );
        if (sportsEvents.length > 0) {
          matches.push(...sportsEvents);
          continue; // Sucesso, continua para próximo script
        }
      }
      // Se não tem @graph mas é um SportsEvent direto
      if (data['@type'] === 'SportsEvent') {
        matches.push(data as SportsEvent);
        continue;
      }
    } catch (error) {
      // Se falhou, tenta extrair JSON do conteúdo de forma mais agressiva
      try {
        // Procura por objeto JSON completo no conteúdo (pode estar minificado)
        const jsonMatch = scriptContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data: any = JSON.parse(jsonMatch[0]);
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            const sportsEvents = data['@graph'].filter((event: any) => 
              event && event['@type'] === 'SportsEvent'
            );
            if (sportsEvents.length > 0) {
              matches.push(...sportsEvents);
              continue;
            }
          }
          if (data['@type'] === 'SportsEvent') {
            matches.push(data as SportsEvent);
            continue;
          }
        }
      } catch (e) {
        // Continua para próxima tentativa
      }
    }
  }
  
  // Estratégia 2: Se não encontrou nada, procura diretamente por JSON no HTML (sem script tag)
  if (matches.length === 0) {
    try {
      // Procura por padrão @graph com SportsEvent em qualquer lugar do HTML
      const graphPattern = /\{"@context":"https:\/\/schema\.org\/"[^}]*"@graph":\[([\s\S]*?)\]\}/;
      const graphMatch = html.match(graphPattern);
      
      if (graphMatch && graphMatch[0]) {
        try {
          const data: any = JSON.parse(graphMatch[0]);
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            const sportsEvents = data['@graph'].filter((event: any) => 
              event && event['@type'] === 'SportsEvent'
            );
            matches.push(...sportsEvents);
          }
        } catch (e) {
          // Tenta extrair eventos individuais
          const graphContent = graphMatch[1];
          // Procura por objetos SportsEvent individuais
          const eventPattern = /\{"@type":"SportsEvent"[\s\S]*?"homeTeam":\{[\s\S]*?\}[\s\S]*?"awayTeam":\{[\s\S]*?\}[\s\S]*?\}/g;
          let eventMatch;
          
          while ((eventMatch = eventPattern.exec(graphContent)) !== null) {
            try {
              const event = JSON.parse(eventMatch[0]);
              if (event['@type'] === 'SportsEvent') {
                matches.push(event);
              }
            } catch (e) {
              // Ignora eventos inválidos
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro na extração alternativa:', e);
    }
  }
  
  // Estratégia 3: Procura por qualquer objeto SportsEvent no HTML (última tentativa)
  if (matches.length === 0) {
    try {
      // Procura pelo início de um SportsEvent
      const startPattern = /"@type":"SportsEvent"/g;
      let startMatch;
      
      while ((startMatch = startPattern.exec(html)) !== null) {
        // Volta para encontrar o início do objeto
        let pos = startMatch.index;
        while (pos > 0 && html[pos] !== '{') pos--;
        
        if (pos >= 0) {
          // Extrai o objeto completo contando chaves
          let braceCount = 0;
          let jsonStr = '';
          let currentPos = pos;
          
          while (currentPos < html.length) {
            const char = html[currentPos];
            jsonStr += char;
            if (char === '{') braceCount++;
            if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                try {
                  const event = JSON.parse(jsonStr);
                  if (event['@type'] === 'SportsEvent' && event.homeTeam && event.awayTeam) {
                    // Verifica se já não foi adicionado
                    const exists = matches.some(m => 
                      m.homeTeam.name === event.homeTeam.name && 
                      m.awayTeam.name === event.awayTeam.name
                    );
                    if (!exists) {
                      matches.push(event);
                    }
                  }
                } catch (e) {
                  // Ignora
                }
                break;
              }
            }
            currentPos++;
          }
        }
      }
    } catch (e) {
      // Ignora
    }
  }
  
  return matches;
}

// Função para extrair status ao vivo de um evento específico no HTML
function extractLiveStatusFromEvent(html: string, eventUrl: string): LiveMatchStatus | undefined {
  // Procura por seções relacionadas ao evento específico
  const eventSection = html.includes(eventUrl) 
    ? html.substring(Math.max(0, html.indexOf(eventUrl) - 5000), html.indexOf(eventUrl) + 5000)
    : '';

  if (!eventSection) return undefined;

  const status: LiveMatchStatus = {
    isLive: false,
    status: 'scheduled',
    lastUpdated: new Date().toISOString()
  };

  // Procura por indicadores de jogo ao vivo
  const liveIndicators = [
    /ao\s+vivo/i,
    /live/i,
    /em\s+andamento/i,
    /jogando\s+agora/i
  ];

  const isLive = liveIndicators.some(pattern => pattern.test(eventSection));
  
  if (isLive) {
    status.isLive = true;
    status.status = 'live';
  }

  // Extrai minuto do jogo
  const minuteMatch = eventSection.match(/(\d+)\s*['']?\s*(min|minuto)/i);
  if (minuteMatch) {
    status.minute = parseInt(minuteMatch[1]) || undefined;
  }

  // Verifica se está no intervalo
  if (eventSection.match(/intervalo|half.?time|ht/i)) {
    status.status = 'halftime';
  }

  // Verifica se terminou
  if (eventSection.match(/finalizado|terminado|finished|ft/i)) {
    status.status = 'finished';
    status.isLive = false;
  }

  // Extrai placar atual
  const scoreMatch = eventSection.match(/(\d+)\s*[-:]\s*(\d+)/);
  if (scoreMatch) {
    status.homeScore = parseInt(scoreMatch[1]) || undefined;
    status.awayScore = parseInt(scoreMatch[2]) || undefined;
  }

  return status.isLive || status.status !== 'scheduled' ? status : undefined;
}

// Função para extrair odds de um evento específico no HTML
function extractOddsFromEvent(html: string, eventUrl: string): MatchOdds | undefined {
  // Procura por seções relacionadas ao evento específico
  const eventSection = html.includes(eventUrl) 
    ? html.substring(Math.max(0, html.indexOf(eventUrl) - 3000), html.indexOf(eventUrl) + 3000)
    : '';

  if (!eventSection) return undefined;

  const odds: MatchOdds = {
    lastUpdated: new Date().toISOString()
  };

  // Procura por padrões de odds próximos ao evento
  // Formato comum: números entre 1.0 e 10.0 que podem ser odds
  const oddsPattern = /\b([1-9]\.\d{1,2}|[2-9]\.\d)\b/g;
  const matches = eventSection.match(oddsPattern);
  
  if (matches && matches.length >= 3) {
    const values = matches.map(m => parseFloat(m)).filter(v => v >= 1.0 && v <= 10.0);
    if (values.length >= 3) {
      odds.homeWin = values[0];
      odds.draw = values[1];
      odds.awayWin = values[2];
    }
    if (values.length >= 5) {
      odds.over1_5 = values[3];
      odds.under1_5 = values[4];
    }
  }

  return (odds.homeWin || odds.over1_5) ? odds : undefined;
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
      
      // Extrai status ao vivo e odds do HTML completo (se disponível)
      const allLiveStatuses = new Map<string, LiveMatchStatus>();
      const allOdds = new Map<string, MatchOdds>();
      
      for (const event of events) {
        if (event.url) {
          const liveStatus = extractLiveStatusFromEvent(html, event.url);
          if (liveStatus) {
            const matchId = `${event.homeTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${event.awayTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            allLiveStatuses.set(matchId, liveStatus);
          }
          
          const odds = extractOddsFromEvent(html, event.url);
          if (odds) {
            const matchId = `${event.homeTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${event.awayTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            allOdds.set(matchId, odds);
          }
        }
      }
      
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
      const matches = events.map(event => {
        const match = convertToMatchDetails(event);
        // Adiciona status ao vivo e odds se disponíveis
        const liveStatus = allLiveStatuses.get(match.id);
        const odds = allOdds.get(match.id);
        if (liveStatus) match.liveStatus = liveStatus;
        if (odds) match.odds = odds;
        return match;
      }).filter(m => m.id) as MatchDetails[];

      console.log('Matches convertidos:', matches.length);
      console.log('Jogos ao vivo encontrados:', matches.filter(m => m.liveStatus?.isLive).length);
      console.log('Jogos com odds encontrados:', matches.filter(m => m.odds).length);

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


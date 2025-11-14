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

interface LeagueGroup {
  leagueName: string;
  matches: MatchDetails[];
}

// URL do serviço FastAPI de scraping (se configurado)
const SCRAPER_SERVICE_URL = process.env.SCRAPER_SERVICE_URL || '';

// Função auxiliar para criar AbortSignal com timeout (compatível com Node.js antigo)
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Limpa o timeout se o signal for abortado manualmente
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  
  return controller.signal;
}

// Função para fazer fetch do HTML do site usando o serviço FastAPI se disponível
async function fetchSiteHTML(url: string): Promise<string> {
  try {
    // Se o serviço FastAPI estiver configurado, usa ele primeiro
    if (SCRAPER_SERVICE_URL) {
      try {
        console.log('Tentando usar serviço FastAPI de scraping...');
        const scraperResponse = await fetch(`${SCRAPER_SERVICE_URL}/scrape?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: createTimeoutSignal(35000),
        });

        if (scraperResponse.ok) {
          const scraperData = await scraperResponse.json();
          if (scraperData.success && scraperData.html) {
            console.log('✅ HTML obtido via serviço FastAPI');
            return scraperData.html;
          } else {
            console.warn('Serviço FastAPI retornou erro:', scraperData.message);
            // Continua para tentar método direto
          }
        } else {
          console.warn('Serviço FastAPI não disponível, tentando método direto...');
          // Continua para tentar método direto
        }
      } catch (scraperError) {
        console.warn('Erro ao usar serviço FastAPI, tentando método direto:', scraperError);
        // Continua para tentar método direto
      }
    }

    // Método direto (fallback)
    console.log('Usando método direto de scraping...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'Referer': 'https://www.google.com/',
      },
      redirect: 'follow',
      signal: createTimeoutSignal(30000),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(`Acesso negado (403): O site está bloqueando requisições automáticas. Use "Colar HTML" ou "Upload de Arquivo" como alternativa.`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Erro ao fazer fetch do site:', error);
    throw error;
  }
}

// Função para extrair dados JSON do HTML (similar à existente)
function extractMatchesFromHTML(html: string): SportsEvent[] {
  const matches: SportsEvent[] = [];
  
  const jsonScriptRegex = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  
  while ((scriptMatch = jsonScriptRegex.exec(html)) !== null) {
    const scriptContent = scriptMatch[1].trim();
    
    if (!scriptContent) continue;
    
    try {
      const data: any = JSON.parse(scriptContent);
      
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
    } catch (error) {
      try {
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
  
  return matches;
}

// Função para extrair ligas do HTML (procura por seções de ligas)
function extractLeaguesFromHTML(html: string): string[] {
  const leagues: string[] = [];
  
  // Procura por padrões comuns de nomes de ligas
  const leaguePatterns = [
    /<h[2-4][^>]*class="[^"]*league[^"]*"[^>]*>([^<]+)<\/h[2-4]>/gi,
    /<div[^>]*class="[^"]*competition[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*league[^"]*"[^>]*>([^<]+)<\/span>/gi,
    /Brasileirão|Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League|Europa League/gi
  ];
  
  for (const pattern of leaguePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const leagueName = match[1]?.trim() || match[0]?.trim();
      if (leagueName && !leagues.includes(leagueName)) {
        leagues.push(leagueName);
      }
    }
  }
  
  return leagues;
}

// Função para agrupar matches por liga
function groupMatchesByLeague(matches: SportsEvent[], html: string): Map<string, SportsEvent[]> {
  const leagueMap = new Map<string, SportsEvent[]>();
  
  // Extrai ligas do HTML
  const leagues = extractLeaguesFromHTML(html);
  
  // Para cada match, tenta identificar a liga
  for (const match of matches) {
    const competition = match.location?.name || '';
    
    // Procura por liga conhecida no nome da competição
    let assignedLeague = 'Outras Ligas';
    
    for (const league of leagues) {
      if (competition.toLowerCase().includes(league.toLowerCase()) || 
          league.toLowerCase().includes(competition.toLowerCase())) {
        assignedLeague = league;
        break;
      }
    }
    
    // Se não encontrou, usa o nome da competição
    if (assignedLeague === 'Outras Ligas' && competition) {
      assignedLeague = competition;
    }
    
    if (!leagueMap.has(assignedLeague)) {
      leagueMap.set(assignedLeague, []);
    }
    leagueMap.get(assignedLeague)!.push(match);
  }
  
  return leagueMap;
}

// Dados placeholder (mesmo da API matches.ts)
const placeholderData = {
  h2hData: [],
  teamAForm: [],
  teamBForm: [],
  standingsData: [],
  teamAGoalStats: {
    home: { avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgTotalGoals: 2.7, noGoalsScoredPct: 20, noGoalsConcededPct: 30, over25Pct: 55, under25Pct: 45, goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] } },
    away: { avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgTotalGoals: 2.7, noGoalsScoredPct: 20, noGoalsConcededPct: 30, over25Pct: 55, under25Pct: 45, goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] } },
    global: { avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgTotalGoals: 2.7, noGoalsScoredPct: 20, noGoalsConcededPct: 30, over25Pct: 55, under25Pct: 45, goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] } }
  },
  teamBGoalStats: {
    home: { avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgTotalGoals: 2.7, noGoalsScoredPct: 20, noGoalsConcededPct: 30, over25Pct: 55, under25Pct: 45, goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] } },
    away: { avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgTotalGoals: 2.7, noGoalsScoredPct: 20, noGoalsConcededPct: 30, over25Pct: 55, under25Pct: 45, goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] } },
    global: { avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgTotalGoals: 2.7, noGoalsScoredPct: 20, noGoalsConcededPct: 30, over25Pct: 55, under25Pct: 45, goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] } }
  },
  teamAStreaks: { home: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 }, away: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 }, global: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 } },
  teamBStreaks: { home: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 }, away: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 }, global: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 } },
  teamAOpponentAnalysis: { home: [], away: [], global: [] },
  teamBOpponentAnalysis: { home: [], away: [], global: [] },
  teamAGoalPatterns: { home: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } }, away: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } }, global: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } } },
  teamBGoalPatterns: { home: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } }, away: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } }, global: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } } },
  teamACorrectScores: { home: { ht: [], ft: [] }, away: { ht: [], ft: [] }, global: { ht: [], ft: [] } },
  teamBCorrectScores: { home: { ht: [], ft: [] }, away: { ht: [], ft: [] }, global: { ht: [], ft: [] } }
};

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
  
  const competition = event.location.name.split(' - ')[1] || event.location.name;
  
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
      competition: competition,
      url: event.url || undefined
    },
    ...placeholderData
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET' || req.method === 'POST') {
    try {
      const url = req.query.url as string || req.body?.url || 'https://www.academiadasapostasbrasil.com/';
      
      console.log('Fazendo scraping do site:', url);
      
      // Faz fetch do HTML do site
      let html: string;
      try {
        html = await fetchSiteHTML(url);
        console.log('HTML obtido, tamanho:', html.length);
      } catch (fetchError) {
        console.error('Erro ao fazer fetch:', fetchError);
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Erro desconhecido ao fazer fetch';
        return res.status(500).json({ 
          error: 'Erro ao fazer scraping do site',
          details: errorMessage,
          message: `Não foi possível acessar o site: ${errorMessage}`
        });
      }
      
      // Extrai os eventos do HTML
      const events = extractMatchesFromHTML(html);
      console.log('Eventos extraídos:', events.length);
      
      if (events.length === 0) {
        return res.status(400).json({ 
          error: 'Nenhum jogo encontrado no site',
          debug: {
            htmlLength: html.length,
            hasScript: html.includes('application/ld+json'),
            hasSportsEvent: html.includes('SportsEvent'),
            sample: html.substring(0, 1000)
          }
        });
      }

      // Agrupa matches por liga
      const leagueMap = groupMatchesByLeague(events, html);
      console.log('Ligas encontradas:', Array.from(leagueMap.keys()));

      // Converte para MatchDetails e organiza por liga
      const leagueGroups: LeagueGroup[] = [];
      
      for (const [leagueName, leagueEvents] of leagueMap.entries()) {
        const matches = leagueEvents.map(event => {
          const match = convertToMatchDetails(event);
          // Tenta extrair status ao vivo e odds se disponível
          // (implementação similar à api/matches.ts)
          return match;
        }).filter(m => m.id) as MatchDetails[];
        
        if (matches.length > 0) {
          leagueGroups.push({
            leagueName,
            matches
          });
        }
      }

      // Ordena ligas por número de jogos (maior primeiro)
      leagueGroups.sort((a, b) => b.matches.length - a.matches.length);

      // Retorna todos os matches (flat) e também organizados por liga
      const allMatches = leagueGroups.flatMap(group => group.matches);

      return res.status(200).json({
        success: true,
        count: allMatches.length,
        matches: allMatches,
        leagues: leagueGroups,
        message: `${allMatches.length} jogos encontrados em ${leagueGroups.length} ligas`
      });
    } catch (error) {
      console.error('Erro ao fazer scraping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Stack trace:', errorStack);
      
      return res.status(500).json({ 
        error: 'Erro ao fazer scraping do site',
        details: errorMessage,
        message: `Erro ao processar o site: ${errorMessage}`
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


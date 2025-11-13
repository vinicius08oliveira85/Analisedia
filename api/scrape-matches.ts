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

// Função para fazer fetch do HTML do site
async function fetchSiteHTML(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
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
      const html = await fetchSiteHTML(url);
      console.log('HTML obtido, tamanho:', html.length);
      
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
      return res.status(500).json({ 
        error: 'Erro ao fazer scraping do site',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


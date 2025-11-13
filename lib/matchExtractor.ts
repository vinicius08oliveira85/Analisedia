import type { MatchDetails, LiveMatchStatus, MatchOdds } from '../types';

export interface SportsEvent {
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

export function getMatchIdFromTeams(homeTeam: string, awayTeam: string): string {
  const homeTeamSlug = homeTeam.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const awayTeamSlug = awayTeam.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${homeTeamSlug}-${awayTeamSlug}`;
}

export function extractMatchesFromHTML(html: string): SportsEvent[] {
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
        // Ignora
      }
    }
  }

  if (matches.length === 0) {
    try {
      const graphPattern = /\{"@context":"https:\/\/schema\.org\/"[^}]*"@graph":\[([\s\S]*?)\]\}/;
      const graphMatch = html.match(graphPattern);

      if (graphMatch && graphMatch[0]) {
        try {
          const data: SchemaData = JSON.parse(graphMatch[0]);
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            const sportsEvents = data['@graph'].filter((event: any) =>
              event && event['@type'] === 'SportsEvent'
            );
            matches.push(...sportsEvents);
          }
        } catch (e) {
          const graphContent = graphMatch[1];
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

  if (matches.length === 0) {
    try {
      const startPattern = /"@type":"SportsEvent"/g;
      let startMatch;

      while ((startMatch = startPattern.exec(html)) !== null) {
        let pos = startMatch.index;
        while (pos > 0 && html[pos] !== '{') pos--;

        if (pos >= 0) {
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

function extractLiveStatusFromEvent(html: string, eventUrl: string): LiveMatchStatus | undefined {
  const eventSection = html.includes(eventUrl)
    ? html.substring(Math.max(0, html.indexOf(eventUrl) - 5000), html.indexOf(eventUrl) + 5000)
    : '';

  if (!eventSection) return undefined;

  const status: LiveMatchStatus = {
    isLive: false,
    status: 'scheduled',
    lastUpdated: new Date().toISOString()
  };

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

  const minuteMatch = eventSection.match(/(\d+)\s*['']?\s*(min|minuto)/i);
  if (minuteMatch) {
    status.minute = parseInt(minuteMatch[1]) || undefined;
  }

  if (eventSection.match(/intervalo|half.?time|ht/i)) {
    status.status = 'halftime';
  }

  if (eventSection.match(/finalizado|terminado|finished|ft/i)) {
    status.status = 'finished';
    status.isLive = false;
  }

  const scoreMatch = eventSection.match(/(\d+)\s*[-:]\s*(\d+)/);
  if (scoreMatch) {
    status.homeScore = parseInt(scoreMatch[1]) || undefined;
    status.awayScore = parseInt(scoreMatch[2]) || undefined;
  }

  return status.isLive || status.status !== 'scheduled' ? status : undefined;
}

function extractOddsFromEvent(html: string, eventUrl: string): MatchOdds | undefined {
  const eventSection = html.includes(eventUrl)
    ? html.substring(Math.max(0, html.indexOf(eventUrl) - 3000), html.indexOf(eventUrl) + 3000)
    : '';

  if (!eventSection) return undefined;

  const odds: MatchOdds = {
    lastUpdated: new Date().toISOString()
  };

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

export function convertToMatchDetails(event: SportsEvent): MatchDetails {
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
  const matchId = getMatchIdFromTeams(event.homeTeam.name, event.awayTeam.name);

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
      competition
    },
    ...placeholderData
  };
}

export interface MatchProcessingResult {
  matches: MatchDetails[];
  events: SportsEvent[];
  liveStatuses: Map<string, LiveMatchStatus>;
  odds: Map<string, MatchOdds>;
  debug: {
    htmlLength: number;
    hasScript: boolean;
    hasSportsEvent: boolean;
    hasGraph: boolean;
  };
}

export function processMatchesHtml(html: string): MatchProcessingResult {
  const events = extractMatchesFromHTML(html);
  const liveStatuses = new Map<string, LiveMatchStatus>();
  const odds = new Map<string, MatchOdds>();

  for (const event of events) {
    if (event.url) {
      const matchId = getMatchIdFromTeams(event.homeTeam.name, event.awayTeam.name);
      const liveStatus = extractLiveStatusFromEvent(html, event.url);
      if (liveStatus) {
        liveStatuses.set(matchId, liveStatus);
      }
      const eventOdds = extractOddsFromEvent(html, event.url);
      if (eventOdds) {
        odds.set(matchId, eventOdds);
      }
    }
  }

  const matches = events.map(event => {
    const match = convertToMatchDetails(event);
    const liveStatus = liveStatuses.get(match.id);
    const matchOdds = odds.get(match.id);
    if (liveStatus) match.liveStatus = liveStatus;
    if (matchOdds) match.odds = matchOdds;
    return match;
  });

  const debug = {
    htmlLength: html.length,
    hasScript: html.includes('application/ld+json'),
    hasSportsEvent: html.includes('SportsEvent'),
    hasGraph: html.includes('@graph')
  };

  return {
    matches,
    events,
    liveStatuses,
    odds,
    debug
  };
}

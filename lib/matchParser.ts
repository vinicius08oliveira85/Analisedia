import type { MatchDetails } from '../types';

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

export interface ProcessedMatch {
  event: SportsEvent;
  match: MatchDetails;
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
} as const;

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
        const sportsEvents = data['@graph'].filter((event: any) => event && event['@type'] === 'SportsEvent');
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
            const sportsEvents = data['@graph'].filter((event: any) => event && event['@type'] === 'SportsEvent');
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
      } catch {
        // Ignora e continua
      }
    }
  }

  if (matches.length === 0) {
    try {
      const graphPattern = /\{"@context":"https:\/\/schema\.org\/"[^}]*"@graph":\[([\s\S]*?)\]\}/;
      const graphMatch = html.match(graphPattern);

      if (graphMatch && graphMatch[0]) {
        try {
          const data: any = JSON.parse(graphMatch[0]);
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            const sportsEvents = data['@graph'].filter((event: any) => event && event['@type'] === 'SportsEvent');
            matches.push(...sportsEvents);
          }
        } catch {
          const graphContent = graphMatch[1];
          const eventPattern = /\{"@type":"SportsEvent"[\s\S]*?"homeTeam":\{[\s\S]*?\}[\s\S]*?"awayTeam":\{[\s\S]*?\}[\s\S]*?\}/g;
          let eventMatch;

          while ((eventMatch = eventPattern.exec(graphContent)) !== null) {
            try {
              const event = JSON.parse(eventMatch[0]);
              if (event['@type'] === 'SportsEvent') {
                matches.push(event);
              }
            } catch {
              // Ignora eventos inválidos
            }
          }
        }
      }
    } catch {
      // Ignora
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
                    const exists = matches.some(m => m.homeTeam.name === event.homeTeam.name && m.awayTeam.name === event.awayTeam.name);
                    if (!exists) {
                      matches.push(event);
                    }
                  }
                } catch {
                  // Ignora
                }
                break;
              }
            }
            currentPos++;
          }
        }
      }
    } catch {
      // Ignora
    }
  }

  return matches;
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

  const competition = event.location?.name?.split(' - ')[1] || event.location?.name || 'Competição não informada';

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
      competition
    },
    ...placeholderData
  };
}

export function processMatchesHtml(html: string): ProcessedMatch[] {
  const events = extractMatchesFromHTML(html);
  const uniqueMatches = new Map<string, ProcessedMatch>();

  for (const event of events) {
    try {
      const match = convertToMatchDetails(event);
      if (!match.id) continue;
      if (!uniqueMatches.has(match.id)) {
        uniqueMatches.set(match.id, { event, match });
      }
    } catch {
      // Ignora eventos que não puderem ser convertidos
    }
  }

  return Array.from(uniqueMatches.values());
}


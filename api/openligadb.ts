import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails, Standing } from '../types';

interface OpenLigaMatch {
  MatchID: number;
  MatchDateTime: string;
  TimeZoneID: string;
  LeagueId: number;
  LeagueName: string;
  LeagueShortcut: string;
  LeagueSeason: number;
  MatchDay: number;
  Group: {
    GroupName: string;
    GroupOrderID: number;
    GroupID: number;
  };
  Team1: {
    TeamId: number;
    TeamName: string;
    ShortName: string;
    TeamIconUrl: string;
    TeamGroupName: string;
  };
  Team2: {
    TeamId: number;
    TeamName: string;
    ShortName: string;
    TeamIconUrl: string;
    TeamGroupName: string;
  };
  LastUpdateDateTime: string;
  MatchIsFinished: boolean;
  MatchResults: Array<{
    ResultID: number;
    ResultName: string;
    PointsTeam1: number;
    PointsTeam2: number;
    ResultOrderID: number;
    ResultTypeID: number;
    ResultDescription: string;
  }>;
  Goals: Array<{
    GoalID: number;
    ScoreTeam1: number;
    ScoreTeam2: number;
    MatchMinute: number;
    GoalGetterID: number;
    GoalGetterName: string;
    IsPenalty: boolean;
    IsOwnGoal: boolean;
    IsOvertime: boolean;
    Comment: string;
  }>;
  Location: {
    LocationID: number;
    LocationCity: string;
    LocationStadium: string;
  };
  NumberOfViewers: number;
}

interface OpenLigaTableEntry {
  TeamInfoId: number;
  TeamName: string;
  ShortName: string;
  TeamIconUrl: string;
  Points: number;
  OpponentGoals: number;
  Goals: number;
  Matches: number;
  Won: number;
  Lost: number;
  Draw: number;
  GoalDiff: number;
}

// Função para converter data do OpenLigaDB para formato ISO
function convertDate(dateString: string): { date: string; time: string } {
  try {
    const date = new Date(dateString);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].substring(0, 5);
    return { date: dateStr, time: timeStr };
  } catch {
    const today = new Date();
    return {
      date: today.toISOString().split('T')[0],
      time: '00:00'
    };
  }
}

// Função para converter match do OpenLigaDB para MatchDetails
function convertToMatchDetails(match: OpenLigaMatch): MatchDetails {
  const { date, time } = convertDate(match.MatchDateTime);
  const matchId = `openligadb_${match.MatchID}`;
  
  // Extrai placar se disponível
  const finalResult = match.MatchResults?.find(r => r.ResultName === 'Endergebnis' || r.ResultTypeID === 2);
  const homeScore = finalResult?.PointsTeam1 ?? 0;
  const awayScore = finalResult?.PointsTeam2 ?? 0;
  
  return {
    id: matchId,
    teamA: {
      name: match.Team1.TeamName,
      logo: match.Team1.TeamIconUrl || ''
    },
    teamB: {
      name: match.Team2.TeamName,
      logo: match.Team2.TeamIconUrl || ''
    },
    matchInfo: {
      date,
      time,
      competition: match.LeagueName || 'Bundesliga',
      url: `https://www.openligadb.de/api/getmatchdata/${match.MatchID}`
    },
    h2hData: [],
    teamAForm: [],
    teamBForm: [],
    standingsData: [],
    teamAGoalStats: {
      home: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } },
      away: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } },
      global: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } }
    },
    teamBGoalStats: {
      home: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } },
      away: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } },
      global: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } }
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
    teamAOpponentAnalysis: { home: [], away: [], global: [] },
    teamBOpponentAnalysis: { home: [], away: [], global: [] },
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
    teamACorrectScores: { home: { ht: [], ft: [] }, away: { ht: [], ft: [] }, global: { ht: [], ft: [] } },
    teamBCorrectScores: { home: { ht: [], ft: [] }, away: { ht: [], ft: [] }, global: { ht: [], ft: [] } },
    liveStatus: match.MatchIsFinished ? {
      isLive: false,
      status: 'finished',
      homeScore: homeScore,
      awayScore: awayScore,
      lastUpdated: match.LastUpdateDateTime
    } : undefined
  };
}

// Função para converter tabela do OpenLigaDB para Standing[]
function convertToStandings(table: OpenLigaTableEntry[], competition: string): Standing[] {
  return table.map((entry, index) => ({
    position: index + 1,
    team: entry.TeamName,
    points: entry.Points,
    played: entry.Matches,
    wins: entry.Won,
    draws: entry.Draw,
    losses: entry.Lost,
    competition
  }));
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
      const { league = 'bl1', season = new Date().getFullYear(), date } = req.query as any || req.body || {};
      
      console.log('[openligadb] Buscando dados:', { league, season, date });

      let matches: OpenLigaMatch[] = [];
      let standings: Standing[] = [];

      // Busca jogos
      try {
        let url = `https://www.openligadb.de/api/getmatchdata/${league}/${season}`;
        
        // Se data específica fornecida, busca jogos daquela data
        if (date) {
          const dateStr = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];
          url = `https://www.openligadb.de/api/getmatchdata/${league}/${season}`;
        }

        console.log('[openligadb] URL:', url);
        const matchesResponse = await fetch(url);
        
        if (!matchesResponse.ok) {
          throw new Error(`HTTP error! status: ${matchesResponse.status}`);
        }

        matches = await matchesResponse.json();
        console.log('[openligadb] Jogos encontrados:', matches.length);

        // Filtra por data se fornecida
        if (date) {
          const dateStr = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];
          matches = matches.filter(m => {
            const matchDate = new Date(m.MatchDateTime).toISOString().split('T')[0];
            return matchDate === dateStr;
          });
          console.log('[openligadb] Jogos filtrados por data:', matches.length);
        }
      } catch (error) {
        console.error('[openligadb] Erro ao buscar jogos:', error);
      }

      // Busca tabela
      try {
        const tableUrl = `https://www.openligadb.de/api/getbltable/${league}/${season}`;
        console.log('[openligadb] Buscando tabela:', tableUrl);
        
        const tableResponse = await fetch(tableUrl);
        
        if (tableResponse.ok) {
          const table: OpenLigaTableEntry[] = await tableResponse.json();
          standings = convertToStandings(table, matches[0]?.LeagueName || 'Bundesliga');
          console.log('[openligadb] Tabela encontrada:', standings.length, 'times');
        }
      } catch (error) {
        console.error('[openligadb] Erro ao buscar tabela:', error);
      }

      // Converte matches para MatchDetails
      const matchDetails: MatchDetails[] = matches.map(convertToMatchDetails);

      // Adiciona standings aos matches (primeiro match da liga)
      if (standings.length > 0 && matchDetails.length > 0) {
        matchDetails[0].standingsData = standings;
      }

      return res.status(200).json({
        success: true,
        matches: matchDetails,
        standings: standings,
        leagues: [matches[0]?.LeagueName || 'Bundesliga'],
        leagueGroups: [{
          leagueName: matches[0]?.LeagueName || 'Bundesliga',
          matches: matchDetails
        }],
        message: `${matchDetails.length} jogos encontrados da ${matches[0]?.LeagueName || 'Bundesliga'}`
      });

    } catch (error) {
      console.error('[openligadb] Erro:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar dados do OpenLigaDB',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


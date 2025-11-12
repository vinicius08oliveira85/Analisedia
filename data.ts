import type { Match, Standing, TeamGoalStats, MatchDetails, TeamStreaks, OpponentAnalysisMatch, GoalScoringPatterns, CorrectScore, ScopedStats } from './types';

const h2hData: Match[] = [
  { date: '2024-10-16', competition: 'Brasileirão Série A', homeTeam: 'Fortaleza', awayTeam: 'Atlético-MG', homeScore: 1, awayScore: 1 },
  { date: '2024-06-23', competition: 'Brasileirão Série A', homeTeam: 'Atlético-MG', awayTeam: 'Fortaleza', homeScore: 1, awayScore: 1 },
  { date: '2023-11-01', competition: 'Brasileirão Série A', homeTeam: 'Atlético-MG', awayTeam: 'Fortaleza', homeScore: 3, awayScore: 1 },
  { date: '2023-06-24', competition: 'Brasileirão Série A', homeTeam: 'Fortaleza', awayTeam: 'Atlético-MG', homeScore: 2, awayScore: 1 },
  { date: '2022-10-24', competition: 'Brasileirão Série A', homeTeam: 'Fortaleza', awayTeam: 'Atlético-MG', homeScore: 0, awayScore: 0 },
  { date: '2022-06-25', competition: 'Brasileirão Série A', homeTeam: 'Atlético-MG', awayTeam: 'Fortaleza', homeScore: 3, awayScore: 2 },
  { date: '2021-10-27', competition: 'Copa do Brasil', homeTeam: 'Fortaleza', awayTeam: 'Atlético-MG', homeScore: 1, awayScore: 2 },
];

const teamAForm: Match[] = [
  { date: '2025-11-08', competition: 'Brasileirão Série A', homeTeam: 'Sport', awayTeam: 'Atlético-MG', homeScore: 2, awayScore: 4, resultForTeam: 'V' },
  { date: '2025-11-05', competition: 'Brasileirão Série A', homeTeam: 'Atlético-MG', awayTeam: 'Bahia', homeScore: 3, awayScore: 0, resultForTeam: 'V' },
  { date: '2025-11-02', competition: 'Brasileirão Série A', homeTeam: 'Internacional', awayTeam: 'Atlético-MG', homeScore: 0, awayScore: 0, resultForTeam: 'E' },
  { date: '2025-10-28', competition: 'Copa Sul-Americana', homeTeam: 'Atlético-MG', awayTeam: 'Ind. del Valle', homeScore: 3, awayScore: 1, resultForTeam: 'V' },
  { date: '2025-10-25', competition: 'Brasileirão Série A', homeTeam: 'Atlético-MG', awayTeam: 'Ceará', homeScore: 1, awayScore: 0, resultForTeam: 'V' },
  { date: '2025-10-21', competition: 'Copa Sul-Americana', homeTeam: 'Ind. del Valle', awayTeam: 'Atlético-MG', homeScore: 1, awayScore: 1, resultForTeam: 'E' },
  { date: '2025-10-18', competition: 'Brasileirão Série A', homeTeam: 'Corinthians', awayTeam: 'Atlético-MG', homeScore: 1, awayScore: 0, resultForTeam: 'D' },
  { date: '2025-10-15', competition: 'Brasileirão Série A', homeTeam: 'Atlético-MG', awayTeam: 'Cruzeiro', homeScore: 1, awayScore: 1, resultForTeam: 'E' },
  { date: '2025-10-08', competition: 'Brasileirão Série A', homeTeam: 'Atlético-MG', awayTeam: 'Sport', homeScore: 3, awayScore: 1, resultForTeam: 'V' },
  { date: '2025-10-04', competition: 'Brasileirão Série A', homeTeam: 'Fluminense', awayTeam: 'Atlético-MG', homeScore: 3, awayScore: 0, resultForTeam: 'D' },
];

const teamBForm: Match[] = [
    { date: '2025-11-09', competition: 'Brasileirão Série A', homeTeam: 'Fortaleza', awayTeam: 'Grêmio', homeScore: 2, awayScore: 2, resultForTeam: 'E' },
    { date: '2025-11-06', competition: 'Brasileirão Série A', homeTeam: 'Ceará', awayTeam: 'Fortaleza', homeScore: 1, awayScore: 1, resultForTeam: 'E' },
    { date: '2025-11-01', competition: 'Brasileirão Série A', homeTeam: 'Santos', awayTeam: 'Fortaleza', homeScore: 1, awayScore: 1, resultForTeam: 'E' },
    { date: '2025-10-25', competition: 'Brasileirão Série A', homeTeam: 'Fortaleza', awayTeam: 'Flamengo', homeScore: 1, awayScore: 0, resultForTeam: 'V' },
    { date: '2025-10-18', competition: 'Brasileirão Série A', homeTeam: 'Cruzeiro', awayTeam: 'Fortaleza', homeScore: 1, awayScore: 0, resultForTeam: 'D' },
    { date: '2025-10-15', competition: 'Brasileirão Série A', homeTeam: 'Fortaleza', awayTeam: 'Vasco', homeScore: 0, awayScore: 2, resultForTeam: 'D' },
    { date: '2025-10-05', competition: 'Brasileirão Série A', homeTeam: 'Juventude', awayTeam: 'Fortaleza', homeScore: 1, awayScore: 2, resultForTeam: 'V' },
    { date: '2025-10-02', competition: 'Brasileirão Série A', homeTeam: 'Fortaleza', awayTeam: 'São Paulo', homeScore: 0, awayScore: 2, resultForTeam: 'D' },
    { date: '2025-09-27', competition: 'Brasileirão Série A', homeTeam: 'Fortaleza', awayTeam: 'Sport', homeScore: 1, awayScore: 0, resultForTeam: 'V' },
    { date: '2025-09-20', competition: 'Brasileirão Série A', homeTeam: 'Palmeiras', awayTeam: 'Fortaleza', homeScore: 4, awayScore: 1, resultForTeam: 'D' },
];

const standingsData: Standing[] = [
    { position: 1, team: 'Palmeiras', points: 68, played: 32, wins: 21, draws: 5, losses: 6 },
    { position: 2, team: 'Flamengo', points: 68, played: 32, wins: 20, draws: 8, losses: 4 },
    { position: 3, team: 'Cruzeiro', points: 64, played: 33, wins: 18, draws: 10, losses: 5 },
    { position: 4, team: 'Mirassol', points: 59, played: 33, wins: 16, draws: 11, losses: 6 },
    { position: 5, team: 'Bahia', points: 53, played: 33, wins: 15, draws: 8, losses: 10 },
    { position: 6, team: 'Botafogo', points: 52, played: 33, wins: 14, draws: 10, losses: 9 },
    { position: 7, team: 'Fluminense', points: 51, played: 33, wins: 15, draws: 6, losses: 12 },
    { position: 8, team: 'São Paulo', points: 45, played: 33, wins: 12, draws: 9, losses: 12 },
    { position: 9, team: 'Atlético-MG', points: 43, played: 32, wins: 11, draws: 10, losses: 11 },
    { position: 10, team: 'Vasco', points: 42, played: 33, wins: 12, draws: 6, losses: 15 },
    { position: 11, team: 'RB Bragantino', points: 42, played: 33, wins: 12, draws: 6, losses: 15 },
    { position: 12, team: 'Ceará', points: 42, played: 33, wins: 11, draws: 9, losses: 13 },
    { position: 13, team: 'Corinthians', points: 42, played: 33, wins: 11, draws: 9, losses: 13 },
    { position: 14, team: 'Grêmio', points: 40, played: 33, wins: 10, draws: 10, losses: 13 },
    { position: 15, team: 'Internacional', points: 37, played: 33, wins: 9, draws: 10, losses: 14 },
    { position: 16, team: 'Vitória', points: 35, played: 33, wins: 8, draws: 11, losses: 14 },
    { position: 17, team: 'Santos', points: 33, played: 32, wins: 8, draws: 9, losses: 15 },
    { position: 18, team: 'Juventude', points: 32, played: 33, wins: 9, draws: 5, losses: 19 },
    { position: 19, team: 'Fortaleza', points: 30, played: 32, wins: 7, draws: 9, losses: 16 },
    { position: 20, team: 'Sport', points: 17, played: 32, wins: 2, draws: 11, losses: 19 },
];

const teamAGoalStats: ScopedStats<TeamGoalStats> = {
    home: {
        avgGoalsScored: 1.44, avgGoalsConceded: 0.88, avgTotalGoals: 2.31,
        noGoalsScoredPct: 25, noGoalsConcededPct: 44, over25Pct: 44, under25Pct: 56,
        goalMoments: { scored: [3, 1, 1, 4, 2, 7], conceded: [0, 0, 1, 4, 1, 4] }
    },
    away: {
        avgGoalsScored: 1.06, avgGoalsConceded: 1.5, avgTotalGoals: 2.56,
        noGoalsScoredPct: 31, noGoalsConcededPct: 19, over25Pct: 56, under25Pct: 44,
        goalMoments: { scored: [2, 2, 2, 3, 3, 5], conceded: [4, 3, 2, 4, 5, 6] }
    },
    global: {
        avgGoalsScored: 1.25, avgGoalsConceded: 1.19, avgTotalGoals: 2.44,
        noGoalsScoredPct: 28, noGoalsConcededPct: 31, over25Pct: 50, under25Pct: 50,
        goalMoments: { scored: [5, 3, 3, 7, 5, 12], conceded: [4, 3, 3, 8, 6, 10] }
    }
};

const teamBGoalStats: ScopedStats<TeamGoalStats> = {
    home: {
        avgGoalsScored: 1.19, avgGoalsConceded: 1.13, avgTotalGoals: 2.31,
        noGoalsScoredPct: 31, noGoalsConcededPct: 31, over25Pct: 38, under25Pct: 63,
        goalMoments: { scored: [3, 2, 4, 2, 3, 5], conceded: [2, 1, 3, 3, 4, 5] }
    },
    away: {
        avgGoalsScored: 0.75, avgGoalsConceded: 1.88, avgTotalGoals: 2.63,
        noGoalsScoredPct: 44, noGoalsConcededPct: 19, over25Pct: 50, under25Pct: 50,
        goalMoments: { scored: [2, 2, 3, 1, 2, 1], conceded: [5, 4, 1, 5, 5, 6] }
    },
    global: {
        avgGoalsScored: 0.97, avgGoalsConceded: 1.5, avgTotalGoals: 2.47,
        noGoalsScoredPct: 38, noGoalsConcededPct: 25, over25Pct: 44, under25Pct: 56,
        goalMoments: { scored: [5, 4, 7, 3, 5, 6], conceded: [7, 5, 4, 8, 9, 11] }
    }
};

const placeholderGoalStats: TeamGoalStats = {
    avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgTotalGoals: 2.7,
    noGoalsScoredPct: 20, noGoalsConcededPct: 30, over25Pct: 55, under25Pct: 45,
    goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
};
const placeholderScopedGoalStats: ScopedStats<TeamGoalStats> = {
    home: placeholderGoalStats, away: placeholderGoalStats, global: placeholderGoalStats
};


const placeholderForm: Match[] = [
    { date: '2025-11-08', competition: 'Brasileirão Série A', homeTeam: 'Time A', awayTeam: 'Time B', homeScore: 2, awayScore: 1, resultForTeam: 'V' },
    { date: '2025-11-05', competition: 'Brasileirão Série A', homeTeam: 'Time C', awayTeam: 'Time A', homeScore: 0, awayScore: 0, resultForTeam: 'E' },
    { date: '2025-11-02', competition: 'Brasileirão Série A', homeTeam: 'Time A', awayTeam: 'Time D', homeScore: 1, awayScore: 2, resultForTeam: 'D' },
];

const teamAStreaksData: ScopedStats<TeamStreaks> = {
    home: { winStreak: 2, drawStreak: 0, lossStreak: 0, unbeatenStreak: 7, winlessStreak: 0, noDrawStreak: 2 },
    away: { winStreak: 1, drawStreak: 0, lossStreak: 0, unbeatenStreak: 2, winlessStreak: 0, noDrawStreak: 1 },
    global: { winStreak: 2, drawStreak: 0, lossStreak: 0, unbeatenStreak: 4, winlessStreak: 0, noDrawStreak: 2 }
};

const teamBStreaksData: ScopedStats<TeamStreaks> = {
    home: { winStreak: 1, drawStreak: 0, lossStreak: 0, unbeatenStreak: 4, winlessStreak: 0, noDrawStreak: 3 },
    away: { winStreak: 0, drawStreak: 3, lossStreak: 0, unbeatenStreak: 3, winlessStreak: 1, noDrawStreak: 0 },
    global: { winStreak: 0, drawStreak: 3, lossStreak: 0, unbeatenStreak: 4, winlessStreak: 0, noDrawStreak: 0 }
};

const teamAOpponentAnalysisDataHome: OpponentAnalysisMatch[] = [
    { opponentRank: 3, homeTeam: 'Atlético-MG', awayTeam: 'Cruzeiro', score: '1-1', result: 'E', date: '2025-10-15', firstGoal: "48''Fora" },
    { opponentRank: 4, homeTeam: 'Atlético-MG', awayTeam: 'Mirassol', score: '1-0', result: 'V', date: '2025-09-27', firstGoal: "9''Casa" },
    { opponentRank: 5, homeTeam: 'Atlético-MG', awayTeam: 'Bahia', score: '3-0', result: 'V', date: '2025-11-05', firstGoal: "66''Casa" },
    { opponentRank: 6, homeTeam: 'Atlético-MG', awayTeam: 'Botafogo', score: '1-0', result: 'V', date: '2025-04-20', firstGoal: "48''Casa" },
    { opponentRank: 7, homeTeam: 'Atlético-MG', awayTeam: 'Fluminense', score: '3-2', result: 'V', date: '2025-05-11', firstGoal: "56''Fora" },
    { opponentRank: 8, homeTeam: 'Atlético-MG', awayTeam: 'São Paulo', score: '0-0', result: 'E', date: '2025-04-06', firstGoal: "-" },
    { opponentRank: 11, homeTeam: 'Atlético-MG', awayTeam: 'RB Bragantino', score: '2-1', result: 'V', date: '2025-08-03', firstGoal: "7''Casa" },
    { opponentRank: 12, homeTeam: 'Atlético-MG', awayTeam: 'Ceará', score: '1-0', result: 'V', date: '2025-10-25', firstGoal: "1''Casa" },
    { opponentRank: 13, homeTeam: 'Atlético-MG', awayTeam: 'Corinthians', score: '0-0', result: 'E', date: '2025-05-24', firstGoal: "-" },
    { opponentRank: 14, homeTeam: 'Atlético-MG', awayTeam: 'Grêmio', score: '1-3', result: 'D', date: '2025-08-17', firstGoal: "38''Casa" },
];
const teamAOpponentAnalysisDataAway: OpponentAnalysisMatch[] = [
    { opponentRank: 1, homeTeam: 'Palmeiras', awayTeam: 'Atlético-MG', score: '2-1', result: 'D', date: '2025-07-20', firstGoal: "22''Casa" },
    { opponentRank: 2, homeTeam: 'Flamengo', awayTeam: 'Atlético-MG', score: '1-1', result: 'E', date: '2025-06-15', firstGoal: "34''Fora" },
    { opponentRank: 15, homeTeam: 'Internacional', awayTeam: 'Atlético-MG', score: '0-0', result: 'E', date: '2025-11-02', firstGoal: "-" },
    { opponentRank: 17, homeTeam: 'Santos', awayTeam: 'Atlético-MG', score: '2-2', result: 'E', date: '2025-07-06', firstGoal: "11''Casa" },
    { opponentRank: 20, homeTeam: 'Sport', awayTeam: 'Atlético-MG', score: '2-4', result: 'V', date: '2025-11-08', firstGoal: "8''Fora" },
];

const teamBOpponentAnalysisDataHome: OpponentAnalysisMatch[] = [
    { opponentRank: 2, homeTeam: 'Fortaleza', awayTeam: 'Flamengo', score: '1-0', result: 'V', date: '2025-10-25', firstGoal: "78''Casa" },
    { opponentRank: 8, homeTeam: 'Fortaleza', awayTeam: 'São Paulo', score: '0-2', result: 'D', date: '2025-10-02', firstGoal: "55''Fora" },
    { opponentRank: 10, homeTeam: 'Fortaleza', awayTeam: 'Vasco', score: '0-2', result: 'D', date: '2025-10-15', firstGoal: "29''Fora" },
    { opponentRank: 14, homeTeam: 'Fortaleza', awayTeam: 'Grêmio', score: '2-2', result: 'E', date: '2025-11-09', firstGoal: "18''Casa" },
    { opponentRank: 20, homeTeam: 'Fortaleza', awayTeam: 'Sport', score: '1-0', result: 'V', date: '2025-09-27', firstGoal: "90''Casa" },
];
const teamBOpponentAnalysisDataAway: OpponentAnalysisMatch[] = [
    { opponentRank: 1, homeTeam: 'Palmeiras', awayTeam: 'Fortaleza', score: '4-1', result: 'D', date: '2025-09-20', firstGoal: "10''Casa" },
    { opponentRank: 3, homeTeam: 'Cruzeiro', awayTeam: 'Fortaleza', score: '1-0', result: 'D', date: '2025-10-18', firstGoal: "21''Casa" },
    { opponentRank: 4, homeTeam: 'Mirassol', awayTeam: 'Fortaleza', score: '1-1', result: 'E', date: '2025-04-06', firstGoal: "15''Fora" },
    { opponentRank: 12, homeTeam: 'Ceará', awayTeam: 'Fortaleza', score: '1-1', result: 'E', date: '2025-11-06', firstGoal: "37''Fora" },
    { opponentRank: 17, homeTeam: 'Santos', awayTeam: 'Fortaleza', score: '1-1', result: 'E', date: '2025-11-01', firstGoal: "35''Fora" },
    { opponentRank: 18, homeTeam: 'Juventude', awayTeam: 'Fortaleza', score: '1-2', result: 'V', date: '2025-10-05', firstGoal: "6''Casa" },
];

const teamAGoalPatterns: ScopedStats<GoalScoringPatterns> = {
    home: {
        opensScore: { games: 8, total: 15, pct: 53 },
        winsWhenOpening: { games: 6, total: 8, pct: 75 },
        comebacks: { games: 1, total: 3, pct: 33 }
    },
    away: {
        opensScore: { games: 7, total: 16, pct: 44 },
        winsWhenOpening: { games: 4, total: 7, pct: 57 },
        comebacks: { games: 2, total: 6, pct: 33 }
    },
    global: {
        opensScore: { games: 15, total: 31, pct: 48 },
        winsWhenOpening: { games: 10, total: 15, pct: 67 },
        comebacks: { games: 3, total: 9, pct: 33 }
    }
};

const teamBGoalPatterns: ScopedStats<GoalScoringPatterns> = {
    home: {
        opensScore: { games: 9, total: 16, pct: 56 },
        winsWhenOpening: { games: 6, total: 9, pct: 67 },
        comebacks: { games: 0, total: 5, pct: 0 }
    },
    away: {
        opensScore: { games: 4, total: 15, pct: 27 },
        winsWhenOpening: { games: 1, total: 4, pct: 25 },
        comebacks: { games: 1, total: 9, pct: 11 }
    },
    global: {
        opensScore: { games: 13, total: 31, pct: 42 },
        winsWhenOpening: { games: 7, total: 13, pct: 54 },
        comebacks: { games: 1, total: 14, pct: 7 }
    }
};

const teamACorrectScores: ScopedStats<{ ht: CorrectScore[], ft: CorrectScore[] }> = {
    home: {
        ht: [ { score: '0-0', count: 9, percentage: 60 }, { score: '1-0', count: 4, percentage: 27 } ],
        ft: [ { score: '1-0', count: 3, percentage: 20 }, { score: '0-0', count: 3, percentage: 20 } ]
    },
    away: {
        ht: [ { score: '0-0', count: 7, percentage: 44 }, { score: '0-1', count: 5, percentage: 31 } ],
        ft: [ { score: '1-1', count: 4, percentage: 25 }, { score: '2-1', count: 3, percentage: 19 } ]
    },
    global: {
        ht: [ { score: '0-0', count: 16, percentage: 52 }, { score: '1-0', count: 6, percentage: 19 } ],
        ft: [ { score: '1-1', count: 6, percentage: 19 }, { score: '1-0', count: 4, percentage: 13 } ]
    }
};

const teamBCorrectScores: ScopedStats<{ ht: CorrectScore[], ft: CorrectScore[] }> = {
    home: {
        ht: [ { score: '0-0', count: 8, percentage: 50 }, { score: '1-0', count: 5, percentage: 31 } ],
        ft: [ { score: '1-0', count: 4, percentage: 25 }, { score: '1-1', count: 3, percentage: 19 } ]
    },
    away: {
        ht: [ { score: '1-0', count: 6, percentage: 40 }, { score: '0-1', count: 4, percentage: 27 } ],
        ft: [ { score: '1-1', count: 4, percentage: 27 }, { score: '2-1', count: 4, percentage: 27 } ]
    },
    global: {
        ht: [ { score: '0-0', count: 12, percentage: 39 }, { score: '1-0', count: 9, percentage: 29 } ],
        ft: [ { score: '1-1', count: 7, percentage: 23 }, { score: '2-1', count: 5, percentage: 16 } ]
    }
};


const placeholderStreaks: ScopedStats<TeamStreaks> = {
    home: { winStreak: 1, drawStreak: 0, lossStreak: 0, unbeatenStreak: 1, winlessStreak: 0, noDrawStreak: 1 },
    away: { winStreak: 0, drawStreak: 1, lossStreak: 0, unbeatenStreak: 1, winlessStreak: 0, noDrawStreak: 0 },
    global: { winStreak: 0, drawStreak: 0, lossStreak: 1, unbeatenStreak: 0, winlessStreak: 1, noDrawStreak: 1 }
};
const placeholderOpponentAnalysis: OpponentAnalysisMatch[] = [
    { opponentRank: 5, homeTeam: 'Placeholder', awayTeam: 'Opponent', score: '1-0', result: 'V', date: '2025-01-01', firstGoal: '10\'\'Casa' }
];
const placeholderScopedOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]> = {
    home: placeholderOpponentAnalysis, away: placeholderOpponentAnalysis, global: placeholderOpponentAnalysis
}
const placeholderGoalPatterns: GoalScoringPatterns = {
    opensScore: { games: 5, total: 10, pct: 50 },
    winsWhenOpening: { games: 4, total: 5, pct: 80 },
    comebacks: { games: 1, total: 4, pct: 25 }
};
const placeholderScopedGoalPatterns: ScopedStats<GoalScoringPatterns> = {
    home: placeholderGoalPatterns, away: placeholderGoalPatterns, global: placeholderGoalPatterns
};
const placeholderCorrectScores: { ht: CorrectScore[], ft: CorrectScore[] } = {
    ht: [{ score: '1-0', count: 5, percentage: 50 }],
    ft: [{ score: '2-1', count: 3, percentage: 30 }]
};
const placeholderScopedCorrectScores: ScopedStats<{ ht: CorrectScore[], ft: CorrectScore[] }> = {
    home: placeholderCorrectScores, away: placeholderCorrectScores, global: placeholderCorrectScores
};


const atleticoVsFortaleza: MatchDetails = {
    id: 'atletico-fortaleza',
    teamA: { name: 'Atlético-MG', logo: 'https://cdngo.academiadasapostasbrasil.com/addons/default/modules/stats/img/team/150x150/317.webp' },
    teamB: { name: 'Fortaleza', logo: 'https://cdngo.academiadasapostasbrasil.com/addons/default/modules/stats/img/team/150x150/327.webp' },
    matchInfo: { date: '12 Novembro 2025', time: '20:30', competition: 'Brasileirão Série A' },
    h2hData,
    teamAForm,
    teamBForm,
    standingsData,
    teamAGoalStats,
    teamBGoalStats,
    teamAStreaks: teamAStreaksData,
    teamBStreaks: teamBStreaksData,
    teamAOpponentAnalysis: { 
        home: teamAOpponentAnalysisDataHome, 
        away: teamAOpponentAnalysisDataAway,
        global: [...teamAOpponentAnalysisDataHome, ...teamAOpponentAnalysisDataAway].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    teamBOpponentAnalysis: { 
        home: teamBOpponentAnalysisDataHome, 
        away: teamBOpponentAnalysisDataAway,
        global: [...teamBOpponentAnalysisDataHome, ...teamBOpponentAnalysisDataAway].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    teamAGoalPatterns,
    teamBGoalPatterns,
    teamACorrectScores,
    teamBCorrectScores
};

const saoPauloVsBragantino: MatchDetails = {
    id: 'sao-paulo-bragantino',
    teamA: { name: 'São Paulo', logo: 'https://api.sofascore.app/api/v1/team/5979/image' },
    teamB: { name: 'RB Bragantino', logo: 'https://api.sofascore.app/api/v1/team/5993/image' },
    matchInfo: { date: '12 Novembro 2025', time: '21:00', competition: 'Brasileirão Série A' },
    h2hData: [{ date: '2024-09-10', competition: 'Brasileirão Série A', homeTeam: 'São Paulo', awayTeam: 'RB Bragantino', homeScore: 2, awayScore: 2 }],
    teamAForm: placeholderForm.map(m => ({ ...m, resultForTeam: 'V' })),
    teamBForm: placeholderForm.map(m => ({ ...m, resultForTeam: 'D' })),
    standingsData,
    teamAGoalStats: placeholderScopedGoalStats,
    teamBGoalStats: placeholderScopedGoalStats,
    teamAStreaks: placeholderStreaks,
    teamBStreaks: placeholderStreaks,
    teamAOpponentAnalysis: placeholderScopedOpponentAnalysis,
    teamBOpponentAnalysis: placeholderScopedOpponentAnalysis,
    teamAGoalPatterns: placeholderScopedGoalPatterns,
    teamBGoalPatterns: placeholderScopedGoalPatterns,
    teamACorrectScores: placeholderScopedCorrectScores,
    teamBCorrectScores: placeholderScopedCorrectScores
};

const cruzeiroVsFluminense: MatchDetails = {
    id: 'cruzeiro-fluminense',
    teamA: { name: 'Cruzeiro', logo: 'https://api.sofascore.app/api/v1/team/5984/image' },
    teamB: { name: 'Fluminense', logo: 'https://api.sofascore.app/api/v1/team/5981/image' },
    matchInfo: { date: '12 Novembro 2025', time: '19:00', competition: 'Brasileirão Série A' },
    h2hData: [],
    teamAForm: placeholderForm.map(m => ({ ...m, resultForTeam: 'E' })),
    teamBForm: placeholderForm.map(m => ({ ...m, resultForTeam: 'V' })),
    standingsData,
    teamAGoalStats: placeholderScopedGoalStats,
    teamBGoalStats: placeholderScopedGoalStats,
    teamAStreaks: placeholderStreaks,
    teamBStreaks: placeholderStreaks,
    teamAOpponentAnalysis: placeholderScopedOpponentAnalysis,
    teamBOpponentAnalysis: placeholderScopedOpponentAnalysis,
    teamAGoalPatterns: placeholderScopedGoalPatterns,
    teamBGoalPatterns: placeholderScopedGoalPatterns,
    teamACorrectScores: placeholderScopedCorrectScores,
    teamBCorrectScores: placeholderScopedCorrectScores
};

const flamengoVsSantos: MatchDetails = {
    id: 'flamengo-santos',
    teamA: { name: 'Flamengo', logo: 'https://api.sofascore.app/api/v1/team/5982/image' },
    teamB: { name: 'Santos', logo: 'https://api.sofascore.app/api/v1/team/5988/image' },
    matchInfo: { date: '12 Novembro 2025', time: '18:30', competition: 'Brasileirão Série A' },
    h2hData: [],
    teamAForm: placeholderForm.map(m => ({ ...m, resultForTeam: 'V' })),
    teamBForm: placeholderForm.map(m => ({ ...m, resultForTeam: 'E' })),
    standingsData,
    teamAGoalStats: placeholderScopedGoalStats,
    teamBGoalStats: placeholderScopedGoalStats,
    teamAStreaks: placeholderStreaks,
    teamBStreaks: placeholderStreaks,
    teamAOpponentAnalysis: placeholderScopedOpponentAnalysis,
    teamBOpponentAnalysis: placeholderScopedOpponentAnalysis,
    teamAGoalPatterns: placeholderScopedGoalPatterns,
    teamBGoalPatterns: placeholderScopedGoalPatterns,
    teamACorrectScores: placeholderScopedCorrectScores,
    teamBCorrectScores: placeholderScopedCorrectScores
};

export const allMatchesData: MatchDetails[] = [
    atleticoVsFortaleza,
    saoPauloVsBragantino,
    cruzeiroVsFluminense,
    flamengoVsSantos
];
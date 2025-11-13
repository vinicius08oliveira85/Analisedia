import type { ReactNode } from 'react';

export type Tab = 'Visão Geral' | 'Análise com IA' | 'Probabilidades' | 'Confronto Direto' | 'Classificação' | 'Análise de Gols';

export interface ScopedStats<T> {
    home: T;
    away: T;
    global: T;
}

export interface Match {
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | string;
  awayScore: number | string;
  resultForTeam?: 'V' | 'E' | 'D' | 'P'; // V=Vitória, E=Empate, D=Derrota, P=Próximo
}

export interface Standing {
  position: number;
  team: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface TeamGoalStats {
  avgGoalsScored: number;
  avgGoalsConceded: number;
  avgTotalGoals: number;
  noGoalsScoredPct: number;
  noGoalsConcededPct: number;
  over25Pct: number;
  under25Pct: number;
  goalMoments: {
    scored: number[];
    conceded: number[];
  };
}

export interface TeamInfo {
    name: string;
    logo: string;
}

export interface MatchInfo {
    date: string;
    time: string;
    competition: string;
    url?: string; // URL da página de detalhes do jogo
}

export interface MatchOdds {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
    over1_5?: number;
    under1_5?: number;
    over2_5?: number;
    under2_5?: number;
    lastUpdated?: string;
}

export interface LiveMatchStatus {
    isLive: boolean;
    status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled';
    minute?: number;
    homeScore?: number;
    awayScore?: number;
    homeScoreHT?: number;
    awayScoreHT?: number;
    lastUpdated?: string;
}

export interface TeamStreaks {
  winStreak: number;
  drawStreak: number;
  lossStreak: number;
  unbeatenStreak: number;
  winlessStreak: number;
  noDrawStreak: number;
}

export interface OpponentAnalysisMatch {
    opponentRank: number | string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    result: 'V' | 'E' | 'D';
    date: string;
    firstGoal: string;
}

export interface GoalScoringPatterns {
    opensScore: { games: number; total: number; pct: number };
    winsWhenOpening: { games: number; total: number; pct: number };
    comebacks: { games: number; total: number; pct: number };
}

export interface CorrectScore {
    score: string;
    percentage: number;
    count: number;
}

// This will be the main object for each match
export interface MatchDetails {
  id: string;
  teamA: TeamInfo;
  teamB: TeamInfo;
  matchInfo: MatchInfo;
  h2hData: Match[];
  teamAForm: Match[];
  teamBForm: Match[];
  standingsData: Standing[];
  teamAGoalStats: ScopedStats<TeamGoalStats>;
  teamBGoalStats: ScopedStats<TeamGoalStats>;
  teamAStreaks: ScopedStats<TeamStreaks>;
  teamBStreaks: ScopedStats<TeamStreaks>;
  teamAOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]>;
  teamBOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]>;
  teamAGoalPatterns: ScopedStats<GoalScoringPatterns>;
  teamBGoalPatterns: ScopedStats<GoalScoringPatterns>;
  teamACorrectScores: ScopedStats<{ ht: CorrectScore[]; ft: CorrectScore[] }>;
  teamBCorrectScores: ScopedStats<{ ht: CorrectScore[]; ft: CorrectScore[] }>;
  liveStatus?: LiveMatchStatus;
  odds?: MatchOdds;
}

export interface CardProps {
    title: string;
    children: ReactNode;
    className?: string;
}

export interface ProbabilityAnalysis {
  homeWin: number;
  draw: number;
  awayWin: number;
  over1_5: number;
  under1_5: number;
  expectedGoalsA: number;
  expectedGoalsB: number;
}

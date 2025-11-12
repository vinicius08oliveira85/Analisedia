import type { MatchDetails, ProbabilityAnalysis, TeamGoalStats } from '../types';

// Hardcoded league averages for Brasileirão Série A based on typical historical data.
// This is a necessary simplification as standings data doesn't include goals.
const LEAGUE_AVG_GOALS_HOME = 1.40;
const LEAGUE_AVG_GOALS_AWAY = 1.10;
const LEAGUE_AVG_GOALS_GLOBAL = (LEAGUE_AVG_GOALS_HOME + LEAGUE_AVG_GOALS_AWAY) / 2;

// Maximum number of goals to calculate in the Poisson matrix for performance.
const MAX_GOALS = 6;

// Memoization cache for factorial calculations.
const factorialCache: { [key: number]: number } = {};
function factorial(n: number): number {
    if (n < 0) return NaN;
    if (n === 0) return 1;
    if (factorialCache[n]) return factorialCache[n];
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    factorialCache[n] = result;
    return result;
}


// Calculates the probability of 'k' events for a given lambda.
function poissonProbability(lambda: number, k: number): number {
    return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

export function calculateProbabilities(match: MatchDetails, scope: 'Contextual' | 'Global'): ProbabilityAnalysis {
    let teamAStats: TeamGoalStats;
    let teamBStats: TeamGoalStats;
    let avgLeagueHome: number;
    let avgLeagueAway: number;

    if (scope === 'Contextual') {
        teamAStats = match.teamAGoalStats.home;
        teamBStats = match.teamBGoalStats.away;
        avgLeagueHome = LEAGUE_AVG_GOALS_HOME;
        avgLeagueAway = LEAGUE_AVG_GOALS_AWAY;
    } else { // Global
        teamAStats = match.teamAGoalStats.global;
        teamBStats = match.teamBGoalStats.global;
        avgLeagueHome = LEAGUE_AVG_GOALS_GLOBAL;
        avgLeagueAway = LEAGUE_AVG_GOALS_GLOBAL;
    }

    // Calculate attack and defense strength relative to the league average
    const teamAAttackStrength = teamAStats.avgGoalsScored / avgLeagueHome;
    const teamADefenseStrength = teamAStats.avgGoalsConceded / avgLeagueAway;
    
    const teamBAttackStrength = teamBStats.avgGoalsScored / avgLeagueAway;
    const teamBDefenseStrength = teamBStats.avgGoalsConceded / avgLeagueHome;

    // Calculate expected goals (lambda) for each team
    const expectedGoalsA = teamAAttackStrength * teamBDefenseStrength * avgLeagueHome;
    const expectedGoalsB = teamBAttackStrength * teamADefenseStrength * avgLeagueAway;

    // Calculate probabilities for each possible score up to MAX_GOALS
    let homeWinProb = 0;
    let drawProb = 0;
    let awayWinProb = 0;
    let under1_5Prob = 0;

    for (let i = 0; i <= MAX_GOALS; i++) { // Team A goals
        for (let j = 0; j <= MAX_GOALS; j++) { // Team B goals
            const scoreProbability = poissonProbability(expectedGoalsA, i) * poissonProbability(expectedGoalsB, j);
            
            if (i > j) {
                homeWinProb += scoreProbability;
            } else if (j > i) {
                awayWinProb += scoreProbability;
            } else {
                drawProb += scoreProbability;
            }

            if (i + j < 1.5) {
                under1_5Prob += scoreProbability;
            }
        }
    }

    const totalProb = homeWinProb + drawProb + awayWinProb;
    // Normalize probabilities to sum to 1 (or 100%)
    const homeWin = (homeWinProb / totalProb) * 100;
    const draw = (drawProb / totalProb) * 100;
    const awayWin = (awayWinProb / totalProb) * 100;
    const under1_5 = (under1_5Prob / totalProb) * 100;
    const over1_5 = 100 - under1_5;
    
    return {
        homeWin,
        draw,
        awayWin,
        over1_5,
        under1_5,
        expectedGoalsA,
        expectedGoalsB
    };
}

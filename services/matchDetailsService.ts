import type { MatchDetails, Match, TeamStreaks, OpponentAnalysisMatch, ScopedStats, Standing, TeamGoalStats, GoalScoringPatterns, CorrectScore } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface MatchDetailsResponse {
  success: boolean;
  matchId: string;
  data: {
    teamAForm: Match[];
    teamBForm: Match[];
    h2hData: Match[];
    standingsData?: Standing[];
    teamAStreaks: ScopedStats<TeamStreaks>;
    teamBStreaks: ScopedStats<TeamStreaks>;
    teamAOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]>;
    teamBOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]>;
    teamAGoalStats?: ScopedStats<TeamGoalStats>;
    teamBGoalStats?: ScopedStats<TeamGoalStats>;
    teamAGoalPatterns?: ScopedStats<GoalScoringPatterns>;
    teamBGoalPatterns?: ScopedStats<GoalScoringPatterns>;
    teamACorrectScores?: ScopedStats<{ ht: CorrectScore[]; ft: CorrectScore[] }>;
    teamBCorrectScores?: ScopedStats<{ ht: CorrectScore[]; ft: CorrectScore[] }>;
  };
  message: string;
}

/**
 * Atualiza os detalhes de uma partida enviando o HTML para a API processar
 */
export async function updateMatchDetailsFromHTML(
  html: string, 
  matchId: string
): Promise<MatchDetailsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/match-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html, matchId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const data: MatchDetailsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar detalhes da partida:', error);
    throw error;
  }
}

/**
 * Faz upload de um arquivo de texto e atualiza os detalhes da partida
 */
export async function uploadMatchDetailsFile(
  file: File, 
  matchId: string
): Promise<MatchDetailsResponse> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const html = e.target?.result as string;
        const result = await updateMatchDetailsFromHTML(html, matchId);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Faz scraping automático dos detalhes da partida usando a URL
 * Usa a API scrape-match-details para obter o HTML e depois processa via match-details
 */
export async function scrapeMatchDetailsFromURL(
  url: string,
  matchId: string
): Promise<MatchDetailsResponse> {
  try {
    // Usa a API scrape-match-details para fazer fetch do HTML (evita CORS)
    const scrapeResponse = await fetch(`${API_BASE_URL}/scrape-match-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, matchId }),
    });

    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro HTTP: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    
    // Se a API retornou HTML, processa via match-details
    if (scrapeData.html) {
      const processResponse = await fetch(`${API_BASE_URL}/match-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html: scrapeData.html, matchId }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro HTTP: ${processResponse.status}`);
      }

      const data: MatchDetailsResponse = await processResponse.json();
      return data;
    }

    // Se não retornou HTML, tenta fazer fetch direto (pode ter problemas de CORS)
    try {
      const htmlResponse = await fetch(url, {
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (htmlResponse.ok) {
        const html = await htmlResponse.text();
        
        const processResponse = await fetch(`${API_BASE_URL}/match-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ html, matchId }),
        });

        if (processResponse.ok) {
          const data: MatchDetailsResponse = await processResponse.json();
          return data;
        }
      }
    } catch (corsError) {
      console.warn('Erro de CORS ao fazer fetch direto:', corsError);
    }

    throw new Error('Não foi possível obter o HTML da página');
  } catch (error) {
    console.error('Erro ao fazer scraping dos detalhes:', error);
    throw error;
  }
}

/**
 * Aplica os dados atualizados a um MatchDetails existente
 */
export function applyMatchDetailsUpdate(
  currentMatch: MatchDetails,
  update: MatchDetailsResponse['data']
): MatchDetails {
  console.log('Aplicando atualização de detalhes:', {
    teamAFormCount: update.teamAForm.length,
    teamBFormCount: update.teamBForm.length,
    h2hCount: update.h2hData.length,
    standingsCount: update.standingsData?.length || 0,
    teamAStreaks: update.teamAStreaks,
    teamBStreaks: update.teamBStreaks,
    teamAAnalysisCount: update.teamAOpponentAnalysis.home.length + update.teamAOpponentAnalysis.global.length,
    teamBAnalysisCount: update.teamBOpponentAnalysis.away.length + update.teamBOpponentAnalysis.global.length,
    hasGoalStats: !!(update.teamAGoalStats && update.teamBGoalStats),
    hasGoalPatterns: !!(update.teamAGoalPatterns && update.teamBGoalPatterns)
  });

  return {
    ...currentMatch,
    teamAForm: update.teamAForm.length > 0 ? update.teamAForm : currentMatch.teamAForm,
    teamBForm: update.teamBForm.length > 0 ? update.teamBForm : currentMatch.teamBForm,
    h2hData: update.h2hData.length > 0 ? update.h2hData : currentMatch.h2hData,
    standingsData: (update.standingsData && update.standingsData.length > 0) ? update.standingsData : currentMatch.standingsData,
    teamAStreaks: update.teamAStreaks || currentMatch.teamAStreaks,
    teamBStreaks: update.teamBStreaks || currentMatch.teamBStreaks,
    teamAOpponentAnalysis: update.teamAOpponentAnalysis || currentMatch.teamAOpponentAnalysis,
    teamBOpponentAnalysis: update.teamBOpponentAnalysis || currentMatch.teamBOpponentAnalysis,
    teamAGoalStats: update.teamAGoalStats || currentMatch.teamAGoalStats,
    teamBGoalStats: update.teamBGoalStats || currentMatch.teamBGoalStats,
    teamAGoalPatterns: update.teamAGoalPatterns || currentMatch.teamAGoalPatterns,
    teamBGoalPatterns: update.teamBGoalPatterns || currentMatch.teamBGoalPatterns,
    teamACorrectScores: update.teamACorrectScores || currentMatch.teamACorrectScores,
    teamBCorrectScores: update.teamBCorrectScores || currentMatch.teamBCorrectScores,
  };
}


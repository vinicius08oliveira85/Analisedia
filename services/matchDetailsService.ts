import type { MatchDetails, Match, TeamStreaks, OpponentAnalysisMatch, ScopedStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface MatchDetailsResponse {
  success: boolean;
  matchId: string;
  data: {
    teamAForm: Match[];
    teamBForm: Match[];
    h2hData: Match[];
    teamAStreaks: ScopedStats<TeamStreaks>;
    teamBStreaks: ScopedStats<TeamStreaks>;
    teamAOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]>;
    teamBOpponentAnalysis: ScopedStats<OpponentAnalysisMatch[]>;
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
    teamAStreaks: update.teamAStreaks,
    teamBStreaks: update.teamBStreaks,
    teamAAnalysisCount: update.teamAOpponentAnalysis.home.length + update.teamAOpponentAnalysis.global.length,
    teamBAnalysisCount: update.teamBOpponentAnalysis.away.length + update.teamBOpponentAnalysis.global.length
  });

  return {
    ...currentMatch,
    teamAForm: update.teamAForm.length > 0 ? update.teamAForm : currentMatch.teamAForm,
    teamBForm: update.teamBForm.length > 0 ? update.teamBForm : currentMatch.teamBForm,
    h2hData: update.h2hData.length > 0 ? update.h2hData : currentMatch.h2hData,
    teamAStreaks: update.teamAStreaks,
    teamBStreaks: update.teamBStreaks,
    teamAOpponentAnalysis: update.teamAOpponentAnalysis,
    teamBOpponentAnalysis: update.teamBOpponentAnalysis,
  };
}


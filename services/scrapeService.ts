import type { MatchDetails } from '../types';

export interface LeagueGroup {
  leagueName: string;
  matches: MatchDetails[];
}

export interface ScrapeMatchesResponse {
  success: boolean;
  count: number;
  matches: MatchDetails[];
  leagues: LeagueGroup[];
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Faz scraping direto do site e retorna jogos organizados por ligas
 */
export async function scrapeMatchesFromSite(url?: string): Promise<ScrapeMatchesResponse> {
  try {
    const targetUrl = url || 'https://www.academiadasapostasbrasil.com/';
    
    const response = await fetch(`${API_BASE_URL}/scrape-matches?url=${encodeURIComponent(targetUrl)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Erro desconhecido',
        message: `Erro HTTP: ${response.status}`,
        details: `Status: ${response.status}`
      }));
      
      const error = new Error(errorData.message || errorData.error || `Erro HTTP: ${response.status}`);
      (error as any).details = errorData.details || errorData.error;
      throw error;
    }

    const data: ScrapeMatchesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao fazer scraping:', error);
    throw error;
  }
}


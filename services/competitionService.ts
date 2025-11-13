import type { Standing, TeamGoalStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface CompetitionData {
  name: string;
  standings: Standing[];
  teamStats: Record<string, TeamGoalStats>;
  url?: string;
}

export interface ProcessCompetitionResponse {
  success: boolean;
  data: CompetitionData;
  message: string;
}

/**
 * Processa HTML de uma página de competição e extrai dados
 */
export async function processCompetitionHTML(html: string, url?: string): Promise<ProcessCompetitionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/process-competition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html, url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const data: ProcessCompetitionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao processar competição:', error);
    throw error;
  }
}

/**
 * Faz scraping de uma URL de competição e processa o HTML
 */
export async function scrapeCompetitionFromURL(url: string): Promise<ProcessCompetitionResponse> {
  try {
    // Primeiro, faz fetch do HTML
    const scrapeResponse = await fetch(`${API_BASE_URL}/scrape-match-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, matchId: 'competition' }),
    });

    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro HTTP: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeData.html) {
      throw new Error('HTML não foi retornado');
    }

    // Processa o HTML
    return await processCompetitionHTML(scrapeData.html, url);
  } catch (error) {
    console.error('Erro ao fazer scraping da competição:', error);
    throw error;
  }
}


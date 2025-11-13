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

/**
 * Busca jogos do OpenLigaDB (Ligas Alemãs - 100% Gratuito e Sem Limites)
 */
export async function getMatchesFromOpenLigaDB(league: string = 'bl1', season?: number, date?: string): Promise<ScrapeMatchesResponse> {
  try {
    const seasonParam = season || new Date().getFullYear();
    const params = new URLSearchParams({
      league,
      season: seasonParam.toString(),
      ...(date && { date })
    });

    const response = await fetch(`${API_BASE_URL}/openligadb?${params}`, {
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
    console.error('Erro ao buscar dados do OpenLigaDB:', error);
    throw error;
  }
}

/**
 * Faz scraping de jogos do soccerway.com
 */
export async function scrapeMatchesFromSoccerway(url?: string, html?: string): Promise<ScrapeMatchesResponse> {
  try {
    const targetUrl = url || 'https://www.soccerway.com/';

    const response = await fetch(`${API_BASE_URL}/scrape-soccerway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: targetUrl, html }),
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
    console.error('Erro ao fazer scraping do soccerway:', error);
    throw error;
  }
}

/**
 * Faz scraping de jogos do sokkerpro.com
 */
export async function scrapeMatchesFromSokkerPro(url?: string, html?: string): Promise<ScrapeMatchesResponse> {
  try {
    const targetUrl = url || 'https://sokkerpro.com/';

    const response = await fetch(`${API_BASE_URL}/scrape-sokkerpro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: targetUrl, html }),
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
    console.error('Erro ao fazer scraping do sokkerpro:', error);
    throw error;
  }
}


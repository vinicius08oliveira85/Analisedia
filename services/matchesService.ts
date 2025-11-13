import type { MatchDetails } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface UpdateMatchesResponse {
  success: boolean;
  count: number;
  matches: MatchDetails[];
  message: string;
}

export interface ScrapeMatchesResponse {
  success: boolean;
  partial?: boolean;
  totalMatches: number;
  matches: Array<MatchDetails & { sourceUrl?: string }>;
  groupedByCompetition: Array<{
    competition: string;
    count: number;
    matches: Array<MatchDetails & { sourceUrl?: string }>;
  }>;
  sources: Array<{
    url: string;
    matchCount: number;
    competitions: string[];
    success: boolean;
    error?: string;
  }>;
  errors?: Array<{ url: string; message: string }>;
  message: string;
}

/**
 * Atualiza os jogos do dia enviando o HTML para a API processar
 */
export async function updateMatchesFromHTML(html: string): Promise<UpdateMatchesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const data: UpdateMatchesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar jogos:', error);
    throw error;
  }
}

/**
 * Busca os jogos atualizados da API
 */
export async function fetchMatches(): Promise<MatchDetails[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    throw error;
  }
}

/**
 * Faz upload de um arquivo de texto e atualiza os jogos
 */
export async function uploadMatchesFile(file: File): Promise<UpdateMatchesResponse> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const html = e.target?.result as string;
        const result = await updateMatchesFromHTML(html);
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
 * Realiza scraping diretamente do site usando as URLs fornecidas
 */
export async function scrapeMatchesFromSite(urls: string[]): Promise<ScrapeMatchesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/scrape-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao realizar scraping' }));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const data: ScrapeMatchesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao realizar scraping direto do site:', error);
    throw error;
  }
}


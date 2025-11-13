import type { League } from '../types';

const STORAGE_KEY = 'futibou_leagues';

/**
 * Obtém todas as ligas salvas
 */
export function getLeagues(): League[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Erro ao carregar ligas:', error);
    return [];
  }
}

/**
 * Salva uma liga (cria ou atualiza)
 */
export function saveLeague(league: League): void {
  try {
    const leagues = getLeagues();
    const index = leagues.findIndex(l => l.id === league.id);
    
    if (index >= 0) {
      leagues[index] = league;
    } else {
      leagues.push(league);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leagues));
  } catch (error) {
    console.error('Erro ao salvar liga:', error);
    throw new Error('Erro ao salvar liga');
  }
}

/**
 * Remove uma liga
 */
export function deleteLeague(id: string): void {
  try {
    const leagues = getLeagues();
    const filtered = leagues.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Erro ao excluir liga:', error);
    throw new Error('Erro ao excluir liga');
  }
}

/**
 * Busca uma liga por ID
 */
export function getLeagueById(id: string): League | null {
  const leagues = getLeagues();
  return leagues.find(l => l.id === id) || null;
}

/**
 * Busca uma liga por nome (busca flexível)
 */
export function findLeagueByName(name: string): League | null {
  const leagues = getLeagues();
  const normalizedName = name.toLowerCase().trim();
  
  return leagues.find(league => {
    const leagueName = league.name.toLowerCase().trim();
    return leagueName === normalizedName || 
           leagueName.includes(normalizedName) || 
           normalizedName.includes(leagueName);
  }) || null;
}

/**
 * Busca liga por competição de uma partida
 */
export function findLeagueForCompetition(competitionName: string): League | null {
  return findLeagueByName(competitionName);
}


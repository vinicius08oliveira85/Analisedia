import type { League, LeagueStorage } from '../types/league';

const STORAGE_KEY = 'futibou_leagues';

/**
 * Carrega todas as ligas do localStorage
 */
export function loadLeagues(): League[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data: LeagueStorage = JSON.parse(stored);
    return data.leagues || [];
  } catch (error) {
    console.error('Erro ao carregar ligas:', error);
    return [];
  }
}

/**
 * Salva ligas no localStorage
 */
export function saveLeagues(leagues: League[]): void {
  try {
    const data: LeagueStorage = { leagues };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar ligas:', error);
    throw new Error('Erro ao salvar ligas');
  }
}

/**
 * Adiciona uma nova liga
 */
export function addLeague(league: Omit<League, 'id' | 'createdAt' | 'updatedAt'>): League {
  const leagues = loadLeagues();
  const newLeague: League = {
    ...league,
    id: `league_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  leagues.push(newLeague);
  saveLeagues(leagues);
  return newLeague;
}

/**
 * Atualiza uma liga existente
 */
export function updateLeague(id: string, updates: Partial<Omit<League, 'id' | 'createdAt'>>): League | null {
  const leagues = loadLeagues();
  const index = leagues.findIndex(l => l.id === id);
  
  if (index === -1) return null;
  
  leagues[index] = {
    ...leagues[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveLeagues(leagues);
  return leagues[index];
}

/**
 * Remove uma liga
 */
export function deleteLeague(id: string): boolean {
  const leagues = loadLeagues();
  const filtered = leagues.filter(l => l.id !== id);
  
  if (filtered.length === leagues.length) return false;
  
  saveLeagues(filtered);
  return true;
}

/**
 * Busca uma liga por nome (busca flexível)
 */
export function findLeagueByName(name: string): League | null {
  const leagues = loadLeagues();
  const normalizedName = name.toLowerCase().trim();
  
  return leagues.find(l => 
    l.name.toLowerCase().trim() === normalizedName ||
    l.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(l.name.toLowerCase())
  ) || null;
}

/**
 * Busca ligas que correspondem a uma competição
 */
export function findLeaguesByCompetition(competitionName: string): League[] {
  const leagues = loadLeagues();
  const normalizedName = competitionName.toLowerCase().trim();
  
  return leagues.filter(l => 
    l.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(l.name.toLowerCase())
  );
}


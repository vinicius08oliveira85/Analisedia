export interface League {
  id: string;
  name: string;
  competitionUrl?: string; // URL da página de competição/liga
  statsUrl?: string; // URL de estatísticas da liga
  country?: string;
  season?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeagueStorage {
  leagues: League[];
}


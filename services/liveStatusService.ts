import type { LiveMatchStatus, MatchOdds, MatchDetails } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface LiveStatusResponse {
  success: boolean;
  matchId: string;
  liveStatus?: LiveMatchStatus;
  odds?: MatchOdds;
  message: string;
}

/**
 * Atualiza o status ao vivo e odds de um jogo específico
 */
export async function updateLiveStatus(
  html: string,
  matchId: string
): Promise<LiveStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/live-status`, {
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

    const data: LiveStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar status ao vivo:', error);
    throw error;
  }
}

/**
 * Atualiza múltiplos jogos ao vivo usando suas URLs
 */
export async function updateMultipleLiveStatuses(
  matches: MatchDetails[]
): Promise<Map<string, { liveStatus?: LiveMatchStatus; odds?: MatchOdds }>> {
  const results = new Map<string, { liveStatus?: LiveMatchStatus; odds?: MatchOdds }>();
  
  // Filtra apenas jogos que podem estar ao vivo (hoje ou próximos)
  const today = new Date().toISOString().split('T')[0];
  const relevantMatches = matches.filter(match => {
    const matchDate = match.matchInfo.date;
    // Inclui jogos de hoje ou futuros
    return matchDate >= today;
  });

  // Processa em paralelo (limitado a 5 requisições simultâneas)
  const batchSize = 5;
  for (let i = 0; i < relevantMatches.length; i += batchSize) {
    const batch = relevantMatches.slice(i, i + batchSize);
    
    await Promise.allSettled(
      batch.map(async (match) => {
        try {
          // Tenta buscar o HTML da página do jogo
          // Nota: Isso requer que a URL do jogo esteja disponível
          // Por enquanto, retorna dados vazios se não houver URL
          if (!match.id) return;
          
          // Aqui você pode fazer fetch da URL do jogo se disponível
          // Por enquanto, apenas retorna estrutura vazia
          results.set(match.id, {});
        } catch (error) {
          console.error(`Erro ao atualizar status do jogo ${match.id}:`, error);
        }
      })
    );
  }

  return results;
}

/**
 * Hook para polling automático de status ao vivo
 */
export class LiveStatusPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling = false;
  private callbacks: Set<(matches: MatchDetails[]) => void> = new Set();
  private matches: MatchDetails[] = [];

  /**
   * Inicia o polling automático
   */
  start(matches: MatchDetails[], intervalMs: number = 30000) {
    if (this.isPolling) {
      this.stop();
    }

    this.matches = matches;
    this.isPolling = true;

    // Primeira atualização imediata
    this.poll();

    // Configura polling periódico
    this.intervalId = setInterval(() => {
      this.poll();
    }, intervalMs);
  }

  /**
   * Para o polling
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
  }

  /**
   * Adiciona um callback para ser chamado quando os dados forem atualizados
   */
  onUpdate(callback: (matches: MatchDetails[]) => void) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Atualiza a lista de jogos
   */
  updateMatches(matches: MatchDetails[]) {
    this.matches = matches;
  }

  /**
   * Executa uma atualização manual
   */
  private async poll() {
    if (!this.isPolling || this.matches.length === 0) return;

    try {
      // Filtra apenas jogos que podem estar ao vivo
      const liveMatches = this.matches.filter(match => {
        if (!match.liveStatus) return false;
        return match.liveStatus.isLive || match.liveStatus.status === 'live';
      });

      if (liveMatches.length === 0) return;

      // Atualiza cada jogo ao vivo
      const updatedMatches = [...this.matches];
      
      for (const match of liveMatches) {
        // Aqui você pode fazer uma requisição para atualizar o status
        // Por enquanto, apenas notifica os callbacks
      }

      // Notifica os callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(updatedMatches);
        } catch (error) {
          console.error('Erro no callback de atualização:', error);
        }
      });
    } catch (error) {
      console.error('Erro no polling:', error);
    }
  }
}


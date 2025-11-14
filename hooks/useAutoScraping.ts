import { useEffect, useRef, useState, useCallback } from 'react';
import { scrapeMatchesFromSite } from '../services/scrapeService';
import type { MatchDetails } from '../types';

interface UseAutoScrapingOptions {
  intervalMs?: number;
  enabled?: boolean;
  url?: string;
}

export function useAutoScraping(
  onMatchesUpdated: (matches: MatchDetails[]) => void,
  onLeaguesUpdated?: (leagues: Array<{ leagueName: string; matches: MatchDetails[] }>) => void,
  options: UseAutoScrapingOptions = {}
) {
  const { intervalMs = 60000, enabled = false, url = 'https://www.academiadasapostasbrasil.com/' } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScrapingRef = useRef(false);
  const [isScraping, setIsScraping] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const callbacksRef = useRef({ onMatchesUpdated, onLeaguesUpdated });

  // Atualiza as referências dos callbacks
  useEffect(() => {
    callbacksRef.current = { onMatchesUpdated, onLeaguesUpdated };
  }, [onMatchesUpdated, onLeaguesUpdated]);

  const performScraping = useCallback(async () => {
    if (isScrapingRef.current) return;
    
    isScrapingRef.current = true;
    setIsScraping(true);
    setError(null);

    try {
      const result = await scrapeMatchesFromSite(url);
      
      if (result.success && result.matches.length > 0) {
        callbacksRef.current.onMatchesUpdated(result.matches);
        
        if (callbacksRef.current.onLeaguesUpdated && result.leagues && result.leagues.length > 0) {
          callbacksRef.current.onLeaguesUpdated(result.leagues);
        }
        
        setLastUpdate(new Date());
        console.log(`✅ Scraping automático concluído: ${result.matches.length} partidas encontradas`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer scraping';
      setError(errorMessage);
      console.error('Erro no scraping automático:', err);
    } finally {
      isScrapingRef.current = false;
      setIsScraping(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Primeira execução imediata
    performScraping();

    // Configura intervalo para atualizações periódicas
    intervalRef.current = setInterval(() => {
      performScraping();
    }, intervalMs);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, performScraping]);

  const startScraping = useCallback(() => {
    if (!isScrapingRef.current) {
      performScraping();
    }
  }, [performScraping]);

  const stopScraping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    isScraping,
    lastUpdate,
    error,
    startScraping,
    stopScraping
  };
}


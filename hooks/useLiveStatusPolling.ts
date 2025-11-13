import { useEffect, useRef, useState } from 'react';
import type { MatchDetails } from '../types';
import { LiveStatusPoller } from '../services/liveStatusService';

interface UseLiveStatusPollingOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export function useLiveStatusPolling(
  matches: MatchDetails[],
  onMatchesUpdated: (matches: MatchDetails[]) => void,
  options: UseLiveStatusPollingOptions = {}
) {
  const { intervalMs = 30000, enabled = true } = options;
  const pollerRef = useRef<LiveStatusPoller | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!enabled || matches.length === 0) {
      if (pollerRef.current) {
        pollerRef.current.stop();
        setIsPolling(false);
      }
      return;
    }

    // Cria o poller se não existir
    if (!pollerRef.current) {
      pollerRef.current = new LiveStatusPoller();
      
      // Configura callback
      pollerRef.current.onUpdate((updatedMatches) => {
        onMatchesUpdated(updatedMatches);
      });
    }

    // Atualiza a lista de jogos
    pollerRef.current.updateMatches(matches);

    // Inicia o polling
    pollerRef.current.start(matches, intervalMs);
    setIsPolling(true);

    // Cleanup
    return () => {
      if (pollerRef.current) {
        pollerRef.current.stop();
        setIsPolling(false);
      }
    };
  }, [matches, enabled, intervalMs, onMatchesUpdated]);

  const startPolling = () => {
    if (pollerRef.current && matches.length > 0) {
      pollerRef.current.start(matches, intervalMs);
      setIsPolling(true);
    }
  };

  const stopPolling = () => {
    if (pollerRef.current) {
      pollerRef.current.stop();
      setIsPolling(false);
    }
  };

  return {
    isPolling,
    startPolling,
    stopPolling
  };
}


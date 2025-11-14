/**
 * Formata data no formato brasileiro com fuso horário correto
 */
export function formatBrazilianDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
}

/**
 * Formata horário no formato brasileiro com fuso horário correto
 */
export function formatBrazilianTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
}

/**
 * Converte data no formato brasileiro para Date
 * Exemplo: "15 de janeiro de 2025" -> Date
 */
export function parseBrazilianDate(dateStr: string): Date | null {
  try {
    // Remove "de" e espaços extras
    const cleaned = dateStr.trim().toLowerCase();
    
    // Mapeia meses em português
    const months: { [key: string]: number } = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2,
      'abril': 3, 'maio': 4, 'junho': 5,
      'julho': 6, 'agosto': 7, 'setembro': 8,
      'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    
    // Padrão: "15 de janeiro de 2025" ou "15 janeiro 2025"
    const patterns = [
      /(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/,
      /(\d+)\s+(\w+)\s+(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const day = parseInt(match[1]);
        const monthName = match[2];
        const year = parseInt(match[3]);
        const month = months[monthName];
        
        if (month !== undefined && !isNaN(day) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    
    // Tenta parse direto se for formato ISO ou outro formato
    const directParse = new Date(dateStr);
    if (!isNaN(directParse.getTime())) {
      return directParse;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao parsear data:', dateStr, error);
    return null;
  }
}

/**
 * Verifica se uma data é hoje ou futura
 */
export function isTodayOrFuture(dateStr: string): boolean {
  const matchDate = parseBrazilianDate(dateStr);
  if (!matchDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  matchDate.setHours(0, 0, 0, 0);
  
  return matchDate >= today;
}

/**
 * Filtra jogos para mostrar apenas os de hoje ou futuros
 */
export function filterTodayAndFutureMatches<T extends { matchInfo: { date: string } }>(
  matches: T[]
): T[] {
  return matches.filter(match => isTodayOrFuture(match.matchInfo.date));
}

/**
 * Limpa jogos antigos do localStorage
 */
export function cleanOldMatchesFromStorage(): void {
  try {
    const savedMatches = window.localStorage.getItem('updatedMatches');
    if (savedMatches) {
      const parsedMatches = JSON.parse(savedMatches);
      if (Array.isArray(parsedMatches)) {
        const filteredMatches = filterTodayAndFutureMatches(parsedMatches);
        if (filteredMatches.length !== parsedMatches.length) {
          // Se houve filtragem, atualiza o localStorage
          if (filteredMatches.length > 0) {
            window.localStorage.setItem('updatedMatches', JSON.stringify(filteredMatches));
          } else {
            // Se não há jogos válidos, remove do localStorage
            window.localStorage.removeItem('updatedMatches');
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao limpar jogos antigos:', error);
  }
}


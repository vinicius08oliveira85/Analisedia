import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails } from '../types';

interface LeagueGroup {
  leagueName: string;
  matches: MatchDetails[];
}

// Função auxiliar para criar AbortSignal com timeout (compatível com Node.js antigo)
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Limpa o timeout se o signal for abortado manualmente
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  
  return controller.signal;
}

// Função para fazer fetch do HTML do site (com suporte a renderização JS)
async function fetchSiteHTML(url: string, useRenderer: boolean = false): Promise<string> {
  // Se o renderizador estiver disponível e solicitado, usa ele
  if (useRenderer && process.env.RENDERER_SERVICE_URL) {
    try {
      console.log('[scrape-soccerway] Usando serviço de renderização para:', url);
      const renderResponse = await fetch(`${process.env.RENDERER_SERVICE_URL}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          wait_time: 5000, // Aguarda 5s para SPAs carregarem
          timeout: 30000,
        }),
      });

      if (renderResponse.ok) {
        const result = await renderResponse.json();
        if (result.success && result.html) {
          console.log('[scrape-soccerway] HTML renderizado obtido com sucesso');
          return result.html;
        }
      }
      console.warn('[scrape-soccerway] Renderizador falhou, usando fallback');
    } catch (renderError) {
      console.warn('[scrape-soccerway] Erro ao usar renderizador:', renderError);
      // Continua com fallback
    }
  }

  // Fallback: fetch normal
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'Referer': 'https://www.google.com/',
      },
      redirect: 'follow',
      signal: createTimeoutSignal(30000),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(`Acesso negado (403): O site está bloqueando requisições automáticas. Use "Colar HTML" ou "Upload de Arquivo" como alternativa.`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Erro ao fazer fetch do site:', error);
    throw error;
  }
}

// Função para detectar se é uma SPA (Single Page Application)
function isSPA(html: string): boolean {
  // Verifica se o HTML tem apenas skeleton/loading (comum em SPAs)
  const hasOnlySkeleton = /<div[^>]*class="[^"]*sk[^"]*"[^>]*>[\s\S]*?Loading/i.test(html) && 
                          !html.includes('event__match') && 
                          !html.includes('event__homeTeam') && 
                          !html.includes('event__awayTeam');
  
  const hasLiveTableEmpty = /<div[^>]*id=["']live-table["'][^>]*>[\s\S]*?<div[^>]*class="[^"]*sk[^"]*"/i.test(html);
  
  const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyContent ? bodyContent[1] : '';
  const bodyTextLength = bodyText.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').trim().length;
  
  // Se o body tem muito pouco conteúdo (menos de 2000 chars sem scripts/styles), provavelmente é SPA
  return hasOnlySkeleton || hasLiveTableEmpty || (bodyTextLength < 2000 && !html.includes('event__match'));
}

// Função para limpar texto HTML
function cleanHTMLText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para extrair jogos do Soccerway
function extractMatchesFromSoccerway(html: string): MatchDetails[] {
  const matches: MatchDetails[] = [];
  
  // Estratégia 1: Busca por estrutura específica do Soccerway/FlashScore (event__match)
  // O Soccerway usa classes como "event__match", "event__homeTeam", "event__awayTeam"
  // Também pode usar outras variações como "event event--twoLine", "event__participant"
  
  // Padrão mais flexível para encontrar eventos
  const eventPatterns = [
    /<div[^>]*class="[^"]*event__match[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*event[^"]*event--twoLine[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*event[^"]*"[^>]*data-event-id[^>]*>([\s\S]*?)<\/div>/gi
  ];
  
  for (const eventMatchRegex of eventPatterns) {
    let eventMatch;
    while ((eventMatch = eventMatchRegex.exec(html)) !== null) {
      const eventHtml = eventMatch[1];
      
      // Extrai times - múltiplos padrões
      let homeTeamMatch = eventHtml.match(/<div[^>]*class="[^"]*event__homeTeam[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) ||
                          eventHtml.match(/<div[^>]*class="[^"]*event__participant[^"]*event__participant--home[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) ||
                          eventHtml.match(/<span[^>]*class="[^"]*event__participant--home[^"]*"[^>]*>([^<]+)<\/span>/i);
      
      let awayTeamMatch = eventHtml.match(/<div[^>]*class="[^"]*event__awayTeam[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) ||
                          eventHtml.match(/<div[^>]*class="[^"]*event__participant[^"]*event__participant--away[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) ||
                          eventHtml.match(/<span[^>]*class="[^"]*event__participant--away[^"]*"[^>]*>([^<]+)<\/span>/i);
      
      // Se não encontrou com padrões específicos, tenta padrão genérico
      if (!homeTeamMatch || !awayTeamMatch) {
        const allParticipants = eventHtml.match(/<span[^>]*class="[^"]*event__participant[^"]*"[^>]*>([^<]+)<\/span>/gi);
        if (allParticipants && allParticipants.length >= 2) {
          homeTeamMatch = [null, cleanHTMLText(allParticipants[0].replace(/<[^>]+>/g, ''))];
          awayTeamMatch = [null, cleanHTMLText(allParticipants[1].replace(/<[^>]+>/g, ''))];
        }
      }
      
      if (homeTeamMatch && awayTeamMatch) {
        const teamA = cleanHTMLText(homeTeamMatch[1] || homeTeamMatch[0]);
        const teamB = cleanHTMLText(awayTeamMatch[1] || awayTeamMatch[0]);
        
        // Valida que são nomes válidos de times
        if (teamA.length < 2 || teamB.length < 2 || teamA === teamB) {
          continue;
        }
        
        // Extrai data/hora
        const timeMatch = eventHtml.match(/<span[^>]*class="[^"]*event__time[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                          eventHtml.match(/<span[^>]*class="[^"]*event__stage--block[^"]*"[^>]*>([^<]+)<\/span>/i);
        const dateMatch = eventHtml.match(/<span[^>]*class="[^"]*event__date[^"]*"[^>]*>([^<]+)<\/span>/i);
        
        // Extrai URL do jogo
        const linkMatch = eventHtml.match(/<a[^>]*href="([^"]*\/matches\/[^"]*)"[^>]*>/i) ||
                          eventHtml.match(/<a[^>]*href="([^"]*\/match\/[^"]*)"[^>]*>/i);
        const matchUrl = linkMatch ? linkMatch[1] : undefined;
        
        // Extrai competição - busca no contexto do evento
        let competitionMatch = eventHtml.match(/<span[^>]*class="[^"]*event__title[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                              eventHtml.match(/<span[^>]*class="[^"]*event__league[^"]*"[^>]*>([^<]+)<\/span>/i);
        
        // Se não encontrou no evento, busca no contexto HTML próximo
        if (!competitionMatch) {
          const eventIndex = html.indexOf(eventMatch[0]);
          const contextBefore = html.substring(Math.max(0, eventIndex - 500), eventIndex);
          competitionMatch = contextBefore.match(/<span[^>]*class="[^"]*event__title[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                            contextBefore.match(/<span[^>]*class="[^"]*event__league[^"]*"[^>]*>([^<]+)<\/span>/i);
        }
        
        let dateStr = new Date().toISOString().split('T')[0];
        let timeStr = timeMatch ? cleanHTMLText(timeMatch[1]) : '00:00';
        
        if (dateMatch) {
          try {
            const dateText = cleanHTMLText(dateMatch[1]);
            // Tenta parsear data no formato do Soccerway
            const parsedDate = new Date(dateText);
            if (!isNaN(parsedDate.getTime())) {
              dateStr = parsedDate.toISOString().split('T')[0];
            }
          } catch (e) {
            // Mantém data atual
          }
        }
        
        const matchId = `soccerway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullUrl = matchUrl && !matchUrl.startsWith('http') ? `https://www.soccerway.com${matchUrl}` : matchUrl;
        
        matches.push(createMatchDetails(
          matchId,
          teamA,
          teamB,
          '',
          '',
          dateStr,
          timeStr,
          competitionMatch ? cleanHTMLText(competitionMatch[1]) : 'Competição',
          fullUrl
        ));
      }
    }
    
    // Se encontrou jogos com este padrão, para de tentar outros
    if (matches.length > 0) break;
  }
  
  // Estratégia 2: Busca por JSON-LD (Schema.org)
  if (matches.length === 0) {
    const jsonScriptRegex = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    
    while ((scriptMatch = jsonScriptRegex.exec(html)) !== null) {
      const scriptContent = scriptMatch[1].trim();
      if (!scriptContent) continue;
      
      try {
        const data: any = JSON.parse(scriptContent);
        
        if (data['@graph'] && Array.isArray(data['@graph'])) {
          const sportsEvents = data['@graph'].filter((event: any) => 
            event && event['@type'] === 'SportsEvent'
          );
          if (sportsEvents.length > 0) {
            for (const event of sportsEvents) {
              const match = convertToMatchDetails(event);
              if (match) matches.push(match);
            }
            continue;
          }
        }
        
        if (data['@type'] === 'SportsEvent') {
          const match = convertToMatchDetails(data);
          if (match) matches.push(match);
        }
      } catch (error) {
        // Continua para próxima estratégia
      }
    }
  }
  
  // Estratégia 3: Busca por links de jogos
  if (matches.length === 0) {
    const matchLinkRegex = /<a[^>]*href="([^"]*\/matches\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    
    while ((linkMatch = matchLinkRegex.exec(html)) !== null) {
      const matchUrl = linkMatch[1];
      const matchHtml = linkMatch[2];
      
      const match = parseMatchFromSoccerwayLink(matchHtml, matchUrl, html);
      if (match) matches.push(match);
    }
  }
  
  // Estratégia 4: Busca por tabelas com estrutura de jogos
  if (matches.length === 0) {
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;
    
    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tableMatch[1];
      
      // Verifica se parece ser uma tabela de jogos
      if (!tableHtml.includes('team') && !tableHtml.includes('match') && !tableHtml.includes('vs')) {
        continue;
      }
      
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowHtml = rowMatch[1];
        
        // Extrai células
        const cells: string[] = [];
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
          cells.push(cleanHTMLText(cellMatch[1]));
        }
        
        if (cells.length >= 3) {
          const match = parseMatchFromCells(cells, html);
          if (match) matches.push(match);
        }
      }
    }
  }
  
  return matches;
}

// Função para converter SportsEvent para MatchDetails
function convertToMatchDetails(event: any): MatchDetails | null {
  try {
    if (!event.homeTeam || !event.awayTeam || !event.startDate) {
      return null;
    }
    
    const startDate = new Date(event.startDate);
    const dateStr = startDate.toISOString().split('T')[0];
    const timeStr = startDate.toTimeString().split(' ')[0].substring(0, 5);
    
    const matchId = `soccerway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return createMatchDetails(
      matchId,
      event.homeTeam.name || 'Time A',
      event.awayTeam.name || 'Time B',
      event.homeTeam.image || '',
      event.awayTeam.image || '',
      dateStr,
      timeStr,
      event.sport || 'Competição',
      event.url || undefined
    );
  } catch (error) {
    console.error('Erro ao converter evento:', error);
    return null;
  }
}

// Função auxiliar para criar MatchDetails
function createMatchDetails(
  id: string,
  teamA: string,
  teamB: string,
  logoA: string,
  logoB: string,
  date: string,
  time: string,
  competition: string,
  url?: string
): MatchDetails {
  return {
    id,
    teamA: { name: teamA, logo: logoA },
    teamB: { name: teamB, logo: logoB },
    matchInfo: { date, time, competition, url },
    h2hData: [],
    teamAForm: [],
    teamBForm: [],
    standingsData: [],
    teamAGoalStats: {
      home: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } },
      away: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } },
      global: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } }
    },
    teamBGoalStats: {
      home: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } },
      away: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } },
      global: { avgGoalsScored: 0, avgGoalsConceded: 0, avgTotalGoals: 0, noGoalsScoredPct: 0, noGoalsConcededPct: 0, over25Pct: 0, under25Pct: 0, goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] } }
    },
    teamAStreaks: {
      home: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 },
      away: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 },
      global: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 }
    },
    teamBStreaks: {
      home: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 },
      away: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 },
      global: { winStreak: 0, drawStreak: 0, lossStreak: 0, unbeatenStreak: 0, winlessStreak: 0, noDrawStreak: 0 }
    },
    teamAOpponentAnalysis: { home: [], away: [], global: [] },
    teamBOpponentAnalysis: { home: [], away: [], global: [] },
    teamAGoalPatterns: {
      home: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } },
      away: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } },
      global: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } }
    },
    teamBGoalPatterns: {
      home: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } },
      away: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } },
      global: { opensScore: { games: 0, total: 0, pct: 0 }, winsWhenOpening: { games: 0, total: 0, pct: 0 }, comebacks: { games: 0, total: 0, pct: 0 } }
    },
    teamACorrectScores: { home: { ht: [], ft: [] }, away: { ht: [], ft: [] }, global: { ht: [], ft: [] } },
    teamBCorrectScores: { home: { ht: [], ft: [] }, away: { ht: [], ft: [] }, global: { ht: [], ft: [] } }
  };
}

// Função para parsear jogo de link do Soccerway
function parseMatchFromSoccerwayLink(linkHtml: string, url: string, fullHtml: string): MatchDetails | null {
  // Extrai texto do link
  const text = cleanHTMLText(linkHtml);
  
  // Procura por padrões como "Time A vs Time B" ou "Time A - Time B"
  const vsMatch = text.match(/([^-–—]+?)\s*(?:vs|v|×|x|-|–|—)\s*(.+)/i);
  if (!vsMatch) return null;
  
  const teamA = vsMatch[1].trim();
  const teamB = vsMatch[2].trim();
  
  if (!teamA || !teamB || teamA.length < 2 || teamB.length < 2) {
    return null;
  }
  
  // Tenta extrair data e hora do contexto
  const dateMatch = fullHtml.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
  const timeMatch = fullHtml.match(/(\d{1,2}:\d{2})/);
  
  let dateStr = new Date().toISOString().split('T')[0];
  let timeStr = '00:00';
  
  if (dateMatch) {
    try {
      const [day, month, year] = dateMatch[1].split(/[\/\-\.]/);
      const fullYear = year.length === 2 ? `20${year}` : year;
      dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (e) {
      // Mantém data atual
    }
  }
  
  if (timeMatch) {
    timeStr = timeMatch[1];
  }
  
  // Extrai competição do contexto ou URL
  let competition = 'Competição';
  const competitionMatch = fullHtml.match(/<[^>]*class="[^"]*competition[^"]*"[^>]*>([^<]+)</i) ||
                           fullHtml.match(/<[^>]*class="[^"]*league[^"]*"[^>]*>([^<]+)</i);
  if (competitionMatch) {
    competition = cleanHTMLText(competitionMatch[1]);
  }
  
  const matchId = `soccerway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullUrl = url.startsWith('http') ? url : `https://www.soccerway.com${url}`;
  
  return createMatchDetails(matchId, teamA, teamB, '', '', dateStr, timeStr, competition, fullUrl);
}

// Função para parsear jogo de div do Soccerway
function parseMatchFromSoccerwayDiv(divHtml: string, fullHtml: string): MatchDetails | null {
  // Extrai texto da div
  const text = cleanHTMLText(divHtml);
  
  // Procura por padrões de times
  const vsMatch = text.match(/([^-–—]+?)\s*(?:vs|v|×|x|-|–|—)\s*(.+)/i);
  if (!vsMatch) return null;
  
  const teamA = vsMatch[1].trim();
  const teamB = vsMatch[2].trim();
  
  if (!teamA || !teamB || teamA.length < 2 || teamB.length < 2) {
    return null;
  }
  
  // Extrai data e hora
  const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
  const timeMatch = text.match(/(\d{1,2}:\d{2})/);
  
  let dateStr = new Date().toISOString().split('T')[0];
  let timeStr = '00:00';
  
  if (dateMatch) {
    try {
      const [day, month, year] = dateMatch[1].split(/[\/\-\.]/);
      const fullYear = year.length === 2 ? `20${year}` : year;
      dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (e) {
      // Mantém data atual
    }
  }
  
  if (timeMatch) {
    timeStr = timeMatch[1];
  }
  
  const matchId = `soccerway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return createMatchDetails(matchId, teamA, teamB, '', '', dateStr, timeStr, 'Competição');
}

// Função para parsear jogo de células de tabela
function parseMatchFromCells(cells: string[], fullHtml: string): MatchDetails | null {
  let teamA = '';
  let teamB = '';
  let date = '';
  let time = '';
  let competition = '';
  
  for (const cell of cells) {
    // Procura por separadores de times
    if (cell.includes(' vs ') || cell.includes(' x ') || cell.includes(' - ') || cell.includes(' v ')) {
      const parts = cell.split(/ vs | x | - | v /i);
      if (parts.length === 2) {
        teamA = parts[0].trim();
        teamB = parts[1].trim();
      }
    }
    
    // Procura por data
    const dateMatch = cell.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      date = dateMatch[1];
    }
    
    // Procura por hora
    const timeMatch = cell.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
      time = timeMatch[1];
    }
    
    // Procura por competição (geralmente tem palavras como "League", "Cup", etc)
    if (cell.length > 5 && (cell.includes('League') || cell.includes('Cup') || cell.includes('Championship'))) {
      competition = cell;
    }
  }
  
  if (!teamA || !teamB) {
    return null;
  }
  
  // Converte data
  let dateStr = new Date().toISOString().split('T')[0];
  if (date) {
    try {
      const [day, month, year] = date.split(/[\/\-]/);
      const fullYear = year.length === 2 ? `20${year}` : year;
      dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (e) {
      // Mantém data atual
    }
  }
  
  const matchId = `soccerway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return createMatchDetails(matchId, teamA, teamB, '', '', dateStr, time || '00:00', competition || 'Competição');
}

// Função para agrupar jogos por liga
function groupMatchesByLeague(matches: MatchDetails[]): Map<string, MatchDetails[]> {
  const leagueMap = new Map<string, MatchDetails[]>();
  
  for (const match of matches) {
    const league = match.matchInfo.competition || 'Outras';
    if (!leagueMap.has(league)) {
      leagueMap.set(league, []);
    }
    leagueMap.get(league)!.push(match);
  }
  
  return leagueMap;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET' || req.method === 'POST') {
    try {
      const url = req.query.url as string || req.body?.url || 'https://www.soccerway.com/';
      const html = req.body?.html as string | undefined;
      
      console.log('[scrape-soccerway] Processando:', url);
      
      let htmlContent: string;
      
      if (html) {
        // Se HTML foi fornecido no body, usa ele
        htmlContent = html;
        console.log('[scrape-soccerway] HTML fornecido, tamanho:', htmlContent.length);
      } else {
        // Caso contrário, faz fetch (tenta usar renderizador se disponível)
        try {
          const useRenderer = url.includes('soccerway.com') || url.includes('sokkerpro.com');
          htmlContent = await fetchSiteHTML(url, useRenderer);
          console.log('[scrape-soccerway] HTML obtido, tamanho:', htmlContent.length);
        } catch (fetchError) {
          console.error('[scrape-soccerway] Erro ao fazer fetch:', fetchError);
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Erro desconhecido ao fazer fetch';
          return res.status(500).json({ 
            error: 'Erro ao fazer scraping do site',
            details: errorMessage,
            message: `Não foi possível acessar o site: ${errorMessage}`
          });
        }
      }
      
      // Verifica se é SPA antes de processar
      const isSPAPage = isSPA(htmlContent);
      
      if (isSPAPage) {
        return res.status(400).json({ 
          error: 'Site é uma SPA (Single Page Application)',
          message: 'O soccerway.com é uma aplicação que carrega dados via JavaScript. O HTML inicial não contém os jogos.\n\n' +
                   '📋 INSTRUÇÕES:\n' +
                   '1. Abra o site https://www.soccerway.com no navegador\n' +
                   '2. Aguarde a página carregar completamente (os jogos aparecerem)\n' +
                   '3. Pressione F12 para abrir o DevTools\n' +
                   '4. Vá na aba "Elements" (Elementos)\n' +
                   '5. Clique com botão direito no elemento <html> ou <body>\n' +
                   '6. Selecione "Copy" > "Copy outerHTML"\n' +
                   '7. Cole o HTML copiado usando o botão "Colar HTML" no aplicativo\n\n' +
                   'Ou use a extensão "Save Page WE" para salvar a página completa renderizada.',
          isSPA: true,
          debug: {
            htmlLength: htmlContent.length,
            hasSkeleton: htmlContent.includes('sk__'),
            hasLoading: htmlContent.includes('Loading'),
            hasEventMatch: htmlContent.includes('event__match'),
            bodyContentLength: (htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '').length
          }
        });
      }
      
      // Extrai os jogos
      const matches = extractMatchesFromSoccerway(htmlContent);
      console.log('[scrape-soccerway] Jogos extraídos:', matches.length);
      
      if (matches.length === 0) {
        return res.status(400).json({ 
          error: 'Nenhum jogo encontrado no HTML',
          message: 'Nenhum jogo foi encontrado no HTML fornecido.\n\n' +
                   '💡 DICAS:\n' +
                   '- Se você copiou o HTML inicial da página, tente copiar o HTML renderizado (após a página carregar)\n' +
                   '- Use F12 > Elements > Copy outerHTML do elemento <html> ou <body>\n' +
                   '- Ou salve a página completa usando "Save Page WE" ou similar\n\n' +
                   'O Soccerway carrega os jogos via JavaScript, então você precisa copiar o HTML após a página carregar completamente.',
          debug: {
            htmlLength: htmlContent.length,
            hasScript: htmlContent.includes('application/ld+json'),
            hasSportsEvent: htmlContent.includes('SportsEvent'),
            hasEventMatch: htmlContent.includes('event__match'),
            hasTable: htmlContent.includes('<table'),
            hasMatch: htmlContent.includes('match'),
            sample: htmlContent.substring(0, 500)
          }
        });
      }

      // Agrupa por liga
      const leagueMap = groupMatchesByLeague(matches);
      const leagueGroups: LeagueGroup[] = Array.from(leagueMap.entries()).map(([leagueName, matches]) => ({
        leagueName,
        matches
      }));

      return res.status(200).json({
        success: true,
        count: matches.length,
        matches: matches,
        leagues: leagueGroups.map(g => g.leagueName),
        leagueGroups: leagueGroups,
        message: `${matches.length} jogos encontrados em ${leagueGroups.length} liga(s)`
      });

    } catch (error) {
      console.error('[scrape-soccerway] Erro:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar scraping',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


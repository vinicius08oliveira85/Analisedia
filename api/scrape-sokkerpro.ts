import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails } from '../types';

interface LeagueGroup {
  leagueName: string;
  matches: MatchDetails[];
}

// Função para fazer fetch do HTML do site (com suporte a renderização JS)
async function fetchSiteHTML(url: string, useRenderer: boolean = false): Promise<string> {
  // Se o renderizador estiver disponível e solicitado, usa ele
  if (useRenderer && process.env.RENDERER_SERVICE_URL) {
    try {
      console.log('[scrape-sokkerpro] Usando serviço de renderização para:', url);
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
          console.log('[scrape-sokkerpro] HTML renderizado obtido com sucesso');
          return result.html;
        }
      }
      console.warn('[scrape-sokkerpro] Renderizador falhou, usando fallback');
    } catch (renderError) {
      console.warn('[scrape-sokkerpro] Erro ao usar renderizador:', renderError);
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
      signal: AbortSignal.timeout(30000),
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

// Função para limpar texto HTML
function cleanHTMLText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para detectar se é uma SPA (Single Page Application)
function isSPA(html: string): boolean {
  // Verifica se o HTML tem apenas um div#app vazio (comum em SPAs)
  const hasOnlyAppDiv = /<div[^>]*id=["']app["'][^>]*>\s*<\/div>/i.test(html);
  const hasReactOrVue = html.includes('react') || html.includes('vue') || html.includes('__REACT') || html.includes('__VUE');
  const hasModuleScripts = /<script[^>]*type=["'][^"]*module["'][^>]*>/i.test(html);
  const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyContent ? bodyContent[1] : '';
  const bodyTextLength = bodyText.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').trim().length;
  
  // Se o body tem muito pouco conteúdo (menos de 500 chars sem scripts/styles), provavelmente é SPA
  return hasOnlyAppDiv || (hasModuleScripts && bodyTextLength < 500) || (hasReactOrVue && bodyTextLength < 1000);
}

// Função para extrair jogos do sokkerpro.com
function extractMatchesFromSokkerPro(html: string): MatchDetails[] {
  const matches: MatchDetails[] = [];
  
  // Verifica se é uma SPA
  if (isSPA(html)) {
    console.log('[scrape-sokkerpro] Detectado como SPA - HTML não contém dados renderizados');
    return matches; // Retorna vazio para que o handler possa dar mensagem apropriada
  }
  
  // Estratégia 1: Busca por JSON-LD (Schema.org) - igual ao sistema atual
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
  
  // Estratégia 2: Busca por tabelas HTML com jogos
  if (matches.length === 0) {
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;
    
    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tableMatch[1];
      
      // Verifica se a tabela parece conter jogos (tem times, datas, etc)
      // Padrões mais flexíveis
      const hasMatchIndicators = tableHtml.includes('vs') || 
                                 tableHtml.includes('x') || 
                                 tableHtml.includes(':') ||
                                 tableHtml.includes('match') ||
                                 tableHtml.includes('game') ||
                                 tableHtml.includes('team') ||
                                 /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?\d{1,2}:\d{2}[\s\S]*?<\/td>/i.test(tableHtml);
      
      if (!hasMatchIndicators) {
        continue;
      }
      
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowHtml = rowMatch[1];
        
        // Pula cabeçalhos
        if (rowHtml.includes('<th') || rowHtml.includes('header')) {
          continue;
        }
        
        // Extrai células
        const cells: string[] = [];
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
          cells.push(cleanHTMLText(cellMatch[1]));
        }
        
        if (cells.length >= 2) {
          // Tenta identificar times, data, hora
          const match = parseMatchFromCells(cells, html);
          if (match) matches.push(match);
        }
      }
    }
  }
  
  // Estratégia 3: Busca por divs/cards de jogos
  if (matches.length === 0) {
    const matchCardRegex = /<div[^>]*(?:class|id)=["'][^"']*(?:match|game|jogo|fixture)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
    let cardMatch;
    
    while ((cardMatch = matchCardRegex.exec(html)) !== null) {
      const cardHtml = cardMatch[1];
      const match = parseMatchFromCard(cardHtml, html);
      if (match) matches.push(match);
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
    
    const matchId = `sokkerpro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: matchId,
      teamA: {
        name: event.homeTeam.name || 'Time A',
        logo: event.homeTeam.image || ''
      },
      teamB: {
        name: event.awayTeam.name || 'Time B',
        logo: event.awayTeam.image || ''
      },
      matchInfo: {
        date: dateStr,
        time: timeStr,
        competition: event.sport || 'Competição',
        url: event.url || undefined
      },
      h2hData: [],
      teamAForm: [],
      teamBForm: [],
      standingsData: [],
      teamAGoalStats: {
        home: {
          avgGoalsScored: 0,
          avgGoalsConceded: 0,
          avgTotalGoals: 0,
          noGoalsScoredPct: 0,
          noGoalsConcededPct: 0,
          over25Pct: 0,
          under25Pct: 0,
          goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] }
        },
        away: {
          avgGoalsScored: 0,
          avgGoalsConceded: 0,
          avgTotalGoals: 0,
          noGoalsScoredPct: 0,
          noGoalsConcededPct: 0,
          over25Pct: 0,
          under25Pct: 0,
          goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] }
        },
        global: {
          avgGoalsScored: 0,
          avgGoalsConceded: 0,
          avgTotalGoals: 0,
          noGoalsScoredPct: 0,
          noGoalsConcededPct: 0,
          over25Pct: 0,
          under25Pct: 0,
          goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] }
        }
      },
      teamBGoalStats: {
        home: {
          avgGoalsScored: 0,
          avgGoalsConceded: 0,
          avgTotalGoals: 0,
          noGoalsScoredPct: 0,
          noGoalsConcededPct: 0,
          over25Pct: 0,
          under25Pct: 0,
          goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] }
        },
        away: {
          avgGoalsScored: 0,
          avgGoalsConceded: 0,
          avgTotalGoals: 0,
          noGoalsScoredPct: 0,
          noGoalsConcededPct: 0,
          over25Pct: 0,
          under25Pct: 0,
          goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] }
        },
        global: {
          avgGoalsScored: 0,
          avgGoalsConceded: 0,
          avgTotalGoals: 0,
          noGoalsScoredPct: 0,
          noGoalsConcededPct: 0,
          over25Pct: 0,
          under25Pct: 0,
          goalMoments: { scored: [0,0,0,0,0,0], conceded: [0,0,0,0,0,0] }
        }
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
  } catch (error) {
    console.error('Erro ao converter evento:', error);
    return null;
  }
}

// Função para parsear jogo de células de tabela
function parseMatchFromCells(cells: string[], fullHtml: string): MatchDetails | null {
  let teamA = '';
  let teamB = '';
  let date = '';
  let time = '';
  let competition = '';
  
  // Estratégia 1: Procura por célula com "vs", "x", "-", "v"
  for (const cell of cells) {
    const vsPatterns = [
      /([^\-–—]+?)\s*(?:vs|v|×|x|-|–|—)\s*(.+)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:vs|v|×|x|-|–|—)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];
    
    for (const pattern of vsPatterns) {
      const match = cell.match(pattern);
      if (match && match[1] && match[2]) {
        teamA = match[1].trim();
        teamB = match[2].trim();
        break;
      }
    }
    
    if (teamA && teamB) break;
  }
  
  // Estratégia 2: Se não encontrou "vs", assume que times estão em células separadas
  if (!teamA || !teamB) {
    // Procura por células que parecem nomes de times (mais de 3 caracteres, não são números/datas)
    const potentialTeams = cells.filter(cell => {
      const cleaned = cell.trim();
      return cleaned.length >= 3 && 
             !/\d{1,2}[\/\-]\d{1,2}/.test(cleaned) && // Não é data
             !/\d{1,2}:\d{2}/.test(cleaned) && // Não é hora
             !/^\d+$/.test(cleaned) && // Não é só número
             !cleaned.toLowerCase().includes('league') &&
             !cleaned.toLowerCase().includes('cup');
    });
    
    if (potentialTeams.length >= 2) {
      teamA = potentialTeams[0].trim();
      teamB = potentialTeams[1].trim();
    }
  }
  
  // Procura data e hora em todas as células
  for (const cell of cells) {
    // Procura por data (vários formatos)
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      /(today|hoje|amanhã|tomorrow)/i
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = cell.match(pattern);
      if (dateMatch) {
        date = dateMatch[1];
        break;
      }
    }
    
    // Procura por hora
    const timeMatch = cell.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
      time = timeMatch[1];
    }
    
    // Procura por competição
    if (cell.length > 5 && 
        (cell.toLowerCase().includes('league') || 
         cell.toLowerCase().includes('cup') || 
         cell.toLowerCase().includes('championship') ||
         cell.toLowerCase().includes('liga') ||
         cell.toLowerCase().includes('campeonato'))) {
      competition = cell;
    }
  }
  
  // Validação: precisa ter pelo menos dois times
  if (!teamA || !teamB || teamA.length < 2 || teamB.length < 2 || teamA === teamB) {
    return null;
  }
  
  // Converte data
  let dateStr = new Date().toISOString().split('T')[0];
  if (date) {
    try {
      if (date.toLowerCase().includes('today') || date.toLowerCase().includes('hoje')) {
        dateStr = new Date().toISOString().split('T')[0];
      } else if (date.toLowerCase().includes('tomorrow') || date.toLowerCase().includes('amanhã')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateStr = tomorrow.toISOString().split('T')[0];
      } else {
        const parts = date.split(/[\/\-]/);
        if (parts.length === 3) {
          let day, month, year;
          if (parts[0].length === 4) {
            // Formato YYYY-MM-DD
            year = parts[0];
            month = parts[1];
            day = parts[2];
          } else {
            // Formato DD-MM-YYYY ou DD/MM/YYYY
            day = parts[0];
            month = parts[1];
            year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          }
          dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    } catch (e) {
      // Mantém data atual
    }
  }
  
  const matchId = `sokkerpro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: matchId,
    teamA: { name: teamA, logo: '' },
    teamB: { name: teamB, logo: '' },
    matchInfo: {
      date: dateStr,
      time: time || '00:00',
      competition: competition || 'Competição',
    },
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

// Função para parsear jogo de card/div
function parseMatchFromCard(cardHtml: string, fullHtml: string): MatchDetails | null {
  // Implementação similar ao parseMatchFromCells
  // Pode ser expandida conforme necessário
  return null;
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
      const url = req.query.url as string || req.body?.url || 'https://sokkerpro.com/';
      const html = req.body?.html as string | undefined;
      
      console.log('[scrape-sokkerpro] Processando:', url);
      
      let htmlContent: string;
      
      if (html) {
        // Se HTML foi fornecido no body, usa ele
        htmlContent = html;
        console.log('[scrape-sokkerpro] HTML fornecido, tamanho:', htmlContent.length);
      } else {
        // Caso contrário, faz fetch (tenta usar renderizador se disponível)
        try {
          const useRenderer = url.includes('sokkerpro.com') || url.includes('soccerway.com');
          htmlContent = await fetchSiteHTML(url, useRenderer);
          console.log('[scrape-sokkerpro] HTML obtido, tamanho:', htmlContent.length);
        } catch (fetchError) {
          console.error('[scrape-sokkerpro] Erro ao fazer fetch:', fetchError);
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
          message: 'O sokkerpro.com é uma aplicação que carrega dados via JavaScript. O HTML inicial não contém os jogos.\n\n' +
                   '📋 INSTRUÇÕES:\n' +
                   '1. Abra o site https://sokkerpro.com no navegador\n' +
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
            hasAppDiv: htmlContent.includes('<div id="app">'),
            bodyContentLength: (htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '').length
          }
        });
      }
      
      // Extrai os jogos
      const matches = extractMatchesFromSokkerPro(htmlContent);
      console.log('[scrape-sokkerpro] Jogos extraídos:', matches.length);
      
      if (matches.length === 0) {
        return res.status(400).json({ 
          error: 'Nenhum jogo encontrado no HTML',
          message: 'Nenhum jogo foi encontrado no HTML fornecido.\n\n' +
                   '💡 DICAS:\n' +
                   '- Se você copiou o HTML inicial da página, tente copiar o HTML renderizado (após a página carregar)\n' +
                   '- Use F12 > Elements > Copy outerHTML do elemento <html> ou <body>\n' +
                   '- Ou salve a página completa usando "Save Page WE" ou similar',
          debug: {
            htmlLength: htmlContent.length,
            hasScript: htmlContent.includes('application/ld+json'),
            hasSportsEvent: htmlContent.includes('SportsEvent'),
            hasTable: htmlContent.includes('<table'),
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
      console.error('[scrape-sokkerpro] Erro:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar scraping',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


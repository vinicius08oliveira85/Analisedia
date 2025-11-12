import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MatchDetails } from '../types';

interface SportsEvent {
  '@type': string;
  sport: string;
  name: string;
  homeTeam: {
    '@type': string;
    name: string;
    image: string;
    url: string;
  };
  awayTeam: {
    '@type': string;
    name: string;
    image: string;
    url: string;
  };
  location: {
    '@type': string;
    name: string;
  };
  startDate: string;
  endDate: string;
  url: string;
}

interface SchemaData {
  '@context': string;
  '@graph': SportsEvent[];
}

class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}

const SUPABASE_TABLE = process.env.SUPABASE_MATCHES_TABLE || 'daily_matches';
const DEFAULT_SOURCE_URL = process.env.DAILY_MATCHES_SOURCE_URL;

type SupabaseMatchRow = {
  match_id: string;
  match_day: string | null;
  kickoff: string | null;
  data: MatchDetails;
  source_url?: string | null;
  updated_at?: string | null;
};

interface PersistableMatch {
  match: MatchDetails;
  kickoff: string | null;
}

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new SupabaseConfigError(
      'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY).'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  return supabaseClient;
}

function inferMatchDay(matches: PersistableMatch[]): string | null {
  for (const entry of matches) {
    if (entry.kickoff) {
      const iso = new Date(entry.kickoff).toISOString();
      return iso.split('T')[0];
    }
  }
  return null;
}

async function saveMatchesToSupabase(matches: PersistableMatch[], sourceUrl: string | null) {
  if (matches.length === 0) return;

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const payload = matches.map(({ match, kickoff }) => {
    let kickoffIso: string | null = null;
    let matchDay: string | null = null;

    if (kickoff) {
      const date = new Date(kickoff);
      if (!Number.isNaN(date.getTime())) {
        kickoffIso = date.toISOString();
        matchDay = kickoffIso.split('T')[0];
      }
    }

    return {
      match_id: match.id,
      kickoff: kickoffIso,
      match_day: matchDay,
      data: match,
      source_url: sourceUrl,
      updated_at: now
    };
  });

  const { error } = await supabase
    .from(SUPABASE_TABLE)
    .upsert(payload, { onConflict: 'match_id' });

  if (error) {
    throw new Error(`Erro ao salvar jogos no Supabase: ${error.message}`);
  }
}

async function fetchMatchesFromSupabase(matchDay?: string | null) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from<SupabaseMatchRow>(SUPABASE_TABLE)
    .select('match_id, match_day, kickoff, data, source_url, updated_at')
    .order('kickoff', { ascending: true, nullsFirst: false });

  if (matchDay) {
    query = query.eq('match_day', matchDay);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar jogos no Supabase: ${error.message}`);
  }

  if (!data) {
    return {
      matches: [] as MatchDetails[],
      matchDay: matchDay ?? null,
      lastUpdated: null as string | null,
      source: null as string | null
    };
  }

  const matches = data.map(item => item.data);
  const computedMatchDay = matchDay ?? data.find(item => item.match_day)?.match_day ?? null;
  const source =
    data.find(item => item.source_url && item.source_url.length > 0)?.source_url ?? null;
  const lastUpdatedTimestamp = data.reduce((latest, item) => {
    if (!item.updated_at) return latest;
    const ts = new Date(item.updated_at).getTime();
    return ts > latest ? ts : latest;
  }, 0);

  return {
    matches,
    matchDay: computedMatchDay,
    lastUpdated: lastUpdatedTimestamp ? new Date(lastUpdatedTimestamp).toISOString() : null,
    source
  };
}

// Função para extrair dados JSON do HTML
function extractMatchesFromHTML(html: string): SportsEvent[] {
  const matches: SportsEvent[] = [];
  
  // Estratégia 1: Procura por scripts com application/ld+json
  // Aceita qualquer combinação de atributos (type=module, data-force, etc.)
  const jsonScriptRegex = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  
  while ((scriptMatch = jsonScriptRegex.exec(html)) !== null) {
    const scriptContent = scriptMatch[1].trim();
    
    if (!scriptContent) continue;
    
    try {
      // Tenta parsear diretamente
      const data: any = JSON.parse(scriptContent);
      
      // Verifica se tem @graph
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        const sportsEvents = data['@graph'].filter((event: any) => 
          event && event['@type'] === 'SportsEvent'
        );
        if (sportsEvents.length > 0) {
          matches.push(...sportsEvents);
          continue; // Sucesso, continua para próximo script
        }
      }
      // Se não tem @graph mas é um SportsEvent direto
      if (data['@type'] === 'SportsEvent') {
        matches.push(data as SportsEvent);
        continue;
      }
    } catch (error) {
      // Se falhou, tenta extrair JSON do conteúdo de forma mais agressiva
      try {
        // Procura por objeto JSON completo no conteúdo (pode estar minificado)
        const jsonMatch = scriptContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data: any = JSON.parse(jsonMatch[0]);
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            const sportsEvents = data['@graph'].filter((event: any) => 
              event && event['@type'] === 'SportsEvent'
            );
            if (sportsEvents.length > 0) {
              matches.push(...sportsEvents);
              continue;
            }
          }
          if (data['@type'] === 'SportsEvent') {
            matches.push(data as SportsEvent);
            continue;
          }
        }
      } catch (e) {
        // Continua para próxima tentativa
      }
    }
  }
  
  // Estratégia 2: Se não encontrou nada, procura diretamente por JSON no HTML (sem script tag)
  if (matches.length === 0) {
    try {
      // Procura por padrão @graph com SportsEvent em qualquer lugar do HTML
      const graphPattern = /\{"@context":"https:\/\/schema\.org\/"[^}]*"@graph":\[([\s\S]*?)\]\}/;
      const graphMatch = html.match(graphPattern);
      
      if (graphMatch && graphMatch[0]) {
        try {
          const data: any = JSON.parse(graphMatch[0]);
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            const sportsEvents = data['@graph'].filter((event: any) => 
              event && event['@type'] === 'SportsEvent'
            );
            matches.push(...sportsEvents);
          }
        } catch (e) {
          // Tenta extrair eventos individuais
          const graphContent = graphMatch[1];
          // Procura por objetos SportsEvent individuais
          const eventPattern = /\{"@type":"SportsEvent"[\s\S]*?"homeTeam":\{[\s\S]*?\}[\s\S]*?"awayTeam":\{[\s\S]*?\}[\s\S]*?\}/g;
          let eventMatch;
          
          while ((eventMatch = eventPattern.exec(graphContent)) !== null) {
            try {
              const event = JSON.parse(eventMatch[0]);
              if (event['@type'] === 'SportsEvent') {
                matches.push(event);
              }
            } catch (e) {
              // Ignora eventos inválidos
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro na extração alternativa:', e);
    }
  }
  
  // Estratégia 3: Procura por qualquer objeto SportsEvent no HTML (última tentativa)
  if (matches.length === 0) {
    try {
      // Procura pelo início de um SportsEvent
      const startPattern = /"@type":"SportsEvent"/g;
      let startMatch;
      
      while ((startMatch = startPattern.exec(html)) !== null) {
        // Volta para encontrar o início do objeto
        let pos = startMatch.index;
        while (pos > 0 && html[pos] !== '{') pos--;
        
        if (pos >= 0) {
          // Extrai o objeto completo contando chaves
          let braceCount = 0;
          let jsonStr = '';
          let currentPos = pos;
          
          while (currentPos < html.length) {
            const char = html[currentPos];
            jsonStr += char;
            if (char === '{') braceCount++;
            if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                try {
                  const event = JSON.parse(jsonStr);
                  if (event['@type'] === 'SportsEvent' && event.homeTeam && event.awayTeam) {
                    // Verifica se já não foi adicionado
                    const exists = matches.some(m => 
                      m.homeTeam.name === event.homeTeam.name && 
                      m.awayTeam.name === event.awayTeam.name
                    );
                    if (!exists) {
                      matches.push(event);
                    }
                  }
                } catch (e) {
                  // Ignora
                }
                break;
              }
            }
            currentPos++;
          }
        }
      }
    } catch (e) {
      // Ignora
    }
  }
  
  return matches;
}

// Dados placeholder para campos que não estão no HTML
const placeholderData = {
  h2hData: [],
  teamAForm: [],
  teamBForm: [],
  standingsData: [],
  teamAGoalStats: {
    home: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    },
    away: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    },
    global: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    }
  },
  teamBGoalStats: {
    home: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    },
    away: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
    },
    global: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      avgTotalGoals: 2.7,
      noGoalsScoredPct: 20,
      noGoalsConcededPct: 30,
      over25Pct: 55,
      under25Pct: 45,
      goalMoments: { scored: [2, 3, 4, 5, 4, 6], conceded: [1, 2, 3, 3, 2, 4] }
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
  teamAOpponentAnalysis: {
    home: [],
    away: [],
    global: []
  },
  teamBOpponentAnalysis: {
    home: [],
    away: [],
    global: []
  },
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
  teamACorrectScores: {
    home: { ht: [], ft: [] },
    away: { ht: [], ft: [] },
    global: { ht: [], ft: [] }
  },
  teamBCorrectScores: {
    home: { ht: [], ft: [] },
    away: { ht: [], ft: [] },
    global: { ht: [], ft: [] }
  }
};

// Função para converter SportsEvent para MatchDetails
function convertToMatchDetails(event: SportsEvent): MatchDetails {
  const startDate = new Date(event.startDate);
  const dateStr = startDate.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  const timeStr = startDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Extrai competição do location name
  const competition = event.location.name.split(' - ')[1] || event.location.name;
  
  // Gera ID único baseado nos times
  const homeTeamSlug = event.homeTeam.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const awayTeamSlug = event.awayTeam.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const matchId = `${homeTeamSlug}-${awayTeamSlug}`;
  
  return {
    id: matchId,
    teamA: {
      name: event.homeTeam.name,
      logo: event.homeTeam.image
    },
    teamB: {
      name: event.awayTeam.name,
      logo: event.awayTeam.image
    },
    matchInfo: {
      date: dateStr,
      time: timeStr,
      competition: competition
    },
    ...placeholderData
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const dateParam = Array.isArray(req.query?.date) ? req.query?.date[0] : req.query?.date;
      const matchDayParam = typeof dateParam === 'string' && dateParam.trim().length > 0
        ? dateParam.trim()
        : null;
      const todayIso = new Date().toISOString().split('T')[0];
      const targetMatchDay = matchDayParam ?? todayIso;

      const { matches, matchDay, lastUpdated, source } = await fetchMatchesFromSupabase(targetMatchDay);

      return res.status(200).json({
        success: true,
        count: matches.length,
        matches,
        matchDay,
        lastUpdated,
        source,
        message: matches.length > 0
          ? `${matches.length} jogos encontrados para ${matchDay ?? 'a data solicitada'}`
          : 'Nenhum jogo encontrado no Supabase para a data solicitada'
      });
    } catch (error) {
      if (error instanceof SupabaseConfigError) {
        return res.status(503).json({ error: error.message });
      }
      console.error('Erro ao buscar jogos:', error);
      return res.status(500).json({ error: 'Erro ao buscar jogos' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
      const htmlFromBody = body?.html;
      const sourceFromBody = typeof body?.sourceUrl === 'string' ? body.sourceUrl : null;
      const shouldForceRefresh = body?.refresh === true || body?.refresh === 'true';

      let resolvedSourceUrl = sourceFromBody || DEFAULT_SOURCE_URL || null;
      let htmlToProcess: string | null = typeof htmlFromBody === 'string' ? htmlFromBody : null;

      if (htmlFromBody && typeof htmlFromBody !== 'string') {
        return res.status(400).json({
          error: 'O campo "html" precisa ser uma string contendo o HTML da página.'
        });
      }

      if (!htmlToProcess) {
        if (!resolvedSourceUrl) {
          return res.status(400).json({
            error: 'Nenhum HTML fornecido. Informe "html" no body ou configure DAILY_MATCHES_SOURCE_URL.'
          });
        }

        console.log(`[matches] Buscando HTML automaticamente de ${resolvedSourceUrl}`);
        const response = await fetch(resolvedSourceUrl);

        if (!response.ok) {
          return res.status(response.status).json({
            error: `Não foi possível obter o HTML da fonte (${response.status} - ${response.statusText}).`,
            source: resolvedSourceUrl
          });
        }

        htmlToProcess = await response.text();
      } else if (shouldForceRefresh && resolvedSourceUrl) {
        console.log(
          '[matches] Atualização forçada ativada; HTML fornecido manualmente, mas origem registrada como',
          resolvedSourceUrl
        );
      }

      if (!htmlToProcess || htmlToProcess.trim().length === 0) {
        return res.status(400).json({
          error: 'HTML vazio recebido. Verifique a fonte informada.'
        });
      }

      console.log('[matches] HTML recebido, tamanho:', htmlToProcess.length);

      const events = extractMatchesFromHTML(htmlToProcess);
      console.log('[matches] Eventos extraídos:', events.length);

      if (events.length === 0) {
        const hasScript = htmlToProcess.includes('application/ld+json');
        const hasSportsEvent = htmlToProcess.includes('SportsEvent');
        const hasGraph = htmlToProcess.includes('@graph');

        return res.status(400).json({
          error: 'Nenhum jogo encontrado no HTML fornecido',
          debug: {
            htmlLength: htmlToProcess.length,
            hasScript,
            hasSportsEvent,
            hasGraph,
            sample: htmlToProcess.substring(0, 500)
          }
        });
      }

      const processed = events
        .map(event => ({
          match: convertToMatchDetails(event),
          kickoff: event.startDate ?? null
        }))
        .filter(entry => entry.match.id) as PersistableMatch[];

      const matches = processed.map(entry => entry.match);
      console.log('[matches] Matches convertidos:', matches.length);

      await saveMatchesToSupabase(processed, resolvedSourceUrl);
      const matchDay = inferMatchDay(processed);

      return res.status(200).json({
        success: true,
        count: matches.length,
        matches,
        matchDay,
        source: resolvedSourceUrl,
        message: `${matches.length} jogos processados com sucesso`,
        syncedAt: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof SupabaseConfigError) {
        return res.status(503).json({ error: error.message });
      }
      console.error('Erro ao processar jogos:', error);
      return res.status(500).json({
        error: 'Erro ao processar jogos',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


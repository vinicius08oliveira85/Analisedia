import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processMatchesHtml } from '../lib/matchParser';
import {
  normalizeDateInput,
  persistProcessedMatches
} from '../lib/matchStorage';
import { isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_TIMEZONE = process.env.MATCHES_TIMEZONE ?? 'America/Sao_Paulo';
const SOURCE_URL_TEMPLATE =
  process.env.MATCHES_SOURCE_URL_TEMPLATE ??
  'https://www.academiadasapostasbrasil.com/stats/matches/%DATE%';
const CRON_SECRET =
  process.env.MATCHES_CRON_SECRET ?? process.env.CRON_SECRET ?? '';

const DEFAULT_FETCH_HEADERS: Record<string, string> = {
  'User-Agent':
    process.env.MATCHES_FETCH_USER_AGENT ??
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache'
};

function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function validateAuth(req: VercelRequest): boolean {
  if (!CRON_SECRET) return true;

  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  const queryToken =
    typeof req.query.token === 'string' ? req.query.token : undefined;
  const bodyToken =
    req.body && typeof (req.body as Record<string, unknown>).token === 'string'
      ? ((req.body as Record<string, string>).token ?? undefined)
      : undefined;

  return [headerToken, queryToken, bodyToken].some(
    token => token && token === CRON_SECRET
  );
}

function buildSourceUrl(date: string, override?: string): string {
  if (override) return override;
  if (SOURCE_URL_TEMPLATE.includes('%DATE%')) {
    return SOURCE_URL_TEMPLATE.replace('%DATE%', date);
  }
  return SOURCE_URL_TEMPLATE;
}

async function fetchSourceHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: DEFAULT_FETCH_HEADERS,
    redirect: 'follow',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar HTML (${response.status}) para ${url}`);
  }

  return response.text();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!validateAuth(req)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Supabase não configurado',
      message: 'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de usar este endpoint.'
    });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const payload = (req.body ?? {}) as Record<string, unknown>;
    const queryDate = typeof req.query.date === 'string' ? req.query.date : undefined;
    const bodyDate = typeof payload.date === 'string' ? payload.date : undefined;
    const targetDate = normalizeDateInput(queryDate ?? bodyDate, DEFAULT_TIMEZONE);

    const querySource =
      typeof req.query.sourceUrl === 'string' ? req.query.sourceUrl : undefined;
    const bodySource =
      typeof payload.sourceUrl === 'string' ? payload.sourceUrl : undefined;
    const sourceUrl = buildSourceUrl(targetDate, bodySource ?? querySource);

    let html: string | undefined =
      typeof payload.html === 'string' ? payload.html : undefined;

    if (!html) {
      html = await fetchSourceHtml(sourceUrl);
    }

    const processed = processMatchesHtml(html);

    if (!processed.length) {
      return res.status(404).json({
        error: 'Nenhum jogo encontrado no HTML da fonte',
        date: targetDate,
        sourceUrl,
        htmlPreview: html.substring(0, 500)
      });
    }

    const persistResult = await persistProcessedMatches(processed, {
      sourceUrl,
      timezone: DEFAULT_TIMEZONE
    });

    return res.status(200).json({
      success: true,
      date: targetDate,
      sourceUrl,
      count: processed.length,
      persisted: persistResult.inserted,
      matches: processed.map(item => item.match)
    });
  } catch (error) {
    console.error('Erro na atualização automática de jogos:', error);
    return res.status(500).json({
      error: 'Falha ao atualizar partidas do dia',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}


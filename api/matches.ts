import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processMatchesHtml } from '../lib/matchParser';
import {
  fetchMatchesByDate,
  persistProcessedMatches
} from '../lib/matchStorage';
import { isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_TIMEZONE = process.env.MATCHES_TIMEZONE ?? 'America/Sao_Paulo';

function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseReady = isSupabaseConfigured();

  if (req.method === 'GET') {
    if (!supabaseReady) {
      return res.status(503).json({
        error: 'Supabase não configurado',
        message: 'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.'
      });
    }

    try {
      const dateParam = typeof req.query.date === 'string' ? req.query.date : undefined;
      const { date, matches } = await fetchMatchesByDate(dateParam, {
        timezone: DEFAULT_TIMEZONE
      });

      return res.status(200).json({
        success: true,
        date,
        count: matches.length,
        matches
      });
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      return res.status(500).json({
        error: 'Erro ao buscar jogos',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { html, sourceUrl } = (req.body ?? {}) as {
        html?: unknown;
        sourceUrl?: string;
      };

      if (!html || typeof html !== 'string') {
        return res.status(400).json({
          error: 'É necessário fornecer o HTML no body: { "html": "..." }'
        });
      }

      const processed = processMatchesHtml(html);

      if (!processed.length) {
        const hasScript = html.includes('application/ld+json');
        const hasSportsEvent = html.includes('SportsEvent');
        const hasGraph = html.includes('@graph');

        return res.status(400).json({
          error: 'Nenhum jogo encontrado no HTML fornecido',
          debug: {
            htmlLength: html.length,
            hasScript,
            hasSportsEvent,
            hasGraph,
            sample: html.substring(0, 500)
          }
        });
      }

      let persisted = 0;

      if (supabaseReady) {
        try {
          const result = await persistProcessedMatches(processed, {
            sourceUrl,
            timezone: DEFAULT_TIMEZONE
          });
          persisted = result.inserted;
        } catch (error) {
          console.error('Erro ao salvar jogos no Supabase:', error);
          return res.status(500).json({
            error: 'Erro ao salvar jogos no Supabase',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      return res.status(200).json({
        success: true,
        count: processed.length,
        matches: processed.map(item => item.match),
        persisted,
        supabase: {
          enabled: supabaseReady
        },
        message: `${processed.length} jogos processados com sucesso`
      });
    } catch (error) {
      console.error('Erro ao processar jogos:', error);
      return res.status(500).json({
        error: 'Erro ao processar jogos',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

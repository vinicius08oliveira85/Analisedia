import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processMatchesHtml } from '../lib/matchExtractor';
import type { MatchDetails } from '../types';

interface LeagueRequest {
  name?: string;
  url: string;
}

const BASE_URL = 'https://www.academiadasapostasbrasil.com';

type MatchWithSource = MatchDetails & { sourceUrl?: string };

function normalizeUrl(input?: string): string {
  if (!input || input.trim().length === 0) {
    return BASE_URL;
  }
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${BASE_URL}${trimmed}`;
  }
  return `${BASE_URL}/${trimmed}`;
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { urls = [], leagues = [] }: { urls?: string[]; leagues?: LeagueRequest[] } = req.body || {};

    const targets = new Set<string>();

    urls
      .filter(Boolean)
      .forEach(url => targets.add(normalizeUrl(url)));

    leagues
      .filter(league => league && league.url)
      .forEach(league => targets.add(normalizeUrl(league.url)));

    if (targets.size === 0) {
      targets.add(BASE_URL);
    }

    const results: Array<{
      url: string;
      matchCount: number;
      competitions: string[];
      success: boolean;
      error?: string;
    }> = [];
    const groupedByCompetition = new Map<string, { matches: MatchWithSource[] }>();
    const aggregatedMatches: MatchWithSource[] = [];
    const errors: Array<{ url: string; message: string }> = [];

    for (const target of targets) {
      try {
        const response = await fetch(target, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
          }
        });

        if (!response.ok) {
          const message = `Falha ao buscar URL (${response.status})`;
          results.push({ url: target, matchCount: 0, competitions: [], success: false, error: message });
          errors.push({ url: target, message });
          continue;
        }

        const html = await response.text();
        const { matches } = processMatchesHtml(html);

        const competitions = new Set<string>();
        matches.forEach(match => {
          competitions.add(match.matchInfo.competition);
          const key = match.matchInfo.competition || 'Competição desconhecida';
          if (!groupedByCompetition.has(key)) {
            groupedByCompetition.set(key, { matches: [] });
          }
          groupedByCompetition.get(key)!.matches.push({ ...match, sourceUrl: target });
          aggregatedMatches.push({ ...match, sourceUrl: target });
        });

        results.push({
          url: target,
          matchCount: matches.length,
          competitions: Array.from(competitions),
          success: true
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados';
        results.push({ url: target, matchCount: 0, competitions: [], success: false, error: message });
        errors.push({ url: target, message });
      }
    }

    const groupedArray = Array.from(groupedByCompetition.entries()).map(([competition, data]) => ({
      competition,
      count: data.matches.length,
      matches: data.matches
    }));

    const success = aggregatedMatches.length > 0;
    const message = success
      ? `${aggregatedMatches.length} jogos encontrados em ${groupedArray.length} competições`
      : 'Nenhum jogo encontrado nas URLs informadas';

    return res.status(success ? 200 : 404).json({
      success,
      partial: success && errors.length > 0,
      totalMatches: aggregatedMatches.length,
      matches: aggregatedMatches,
      groupedByCompetition: groupedArray,
      sources: results,
      errors,
      message
    });
  } catch (error) {
    console.error('Erro ao realizar scraping:', error);
    return res.status(500).json({
      error: 'Erro ao realizar scraping do site',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails } from '../types';

// Função para fazer fetch do HTML do site
async function fetchSiteHTML(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Erro ao fazer fetch do site:', error);
    throw error;
  }
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
      const url = req.query.url as string || req.body?.url;
      const matchId = req.query.matchId as string || req.body?.matchId;

      if (!url) {
        return res.status(400).json({ 
          error: 'É necessário fornecer a URL do jogo: ?url=... ou { "url": "..." }' 
        });
      }

      console.log('Fazendo scraping dos detalhes do jogo:', url);
      
      // Faz fetch do HTML da página de detalhes
      const html = await fetchSiteHTML(url);
      console.log('HTML obtido, tamanho:', html.length);

      // Chama a API match-details internamente processando o HTML
      // Usa a mesma lógica, mas fazendo fetch interno
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.VERCEL 
          ? `https://${process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL}` 
          : 'http://localhost:3000';
      
      try {
        // Tenta fazer fetch interno
        const matchDetailsResponse = await fetch(`${baseUrl}/api/match-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ html, matchId: matchId || 'unknown' }),
        });

        if (matchDetailsResponse.ok) {
          const matchDetailsData = await matchDetailsResponse.json();
          return res.status(200).json(matchDetailsData);
        }
      } catch (fetchError) {
        console.warn('Erro ao fazer fetch interno:', fetchError);
        return res.status(500).json({ 
          error: 'Não foi possível processar os detalhes',
          details: fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'
        });
      }

    } catch (error) {
      console.error('Erro ao fazer scraping dos detalhes:', error);
      return res.status(500).json({ 
        error: 'Erro ao fazer scraping dos detalhes do jogo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


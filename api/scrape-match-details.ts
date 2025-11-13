import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Match, TeamStreaks, OpponentAnalysisMatch, ScopedStats } from '../types';

// Importa funções do match-details.ts dinamicamente
// Como não podemos fazer import direto, vamos copiar a lógica essencial

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

// Processa o HTML e retorna os dados extraídos
// Usa a mesma lógica do match-details.ts mas processa diretamente
async function processMatchDetailsHTML(html: string, matchId: string) {
  // Importa dinamicamente as funções necessárias do match-details
  // Como não podemos fazer import direto de funções não exportadas,
  // vamos fazer um POST para a própria API match-details com o HTML
  // Mas isso não funciona no Vercel...
  
  // SOLUÇÃO: Fazer POST do HTML para a API match-details via body
  // A API match-details já tem toda a lógica de extração
  
  // Mas como estamos em serverless, vamos usar uma abordagem diferente:
  // Enviar o HTML como body para processamento
  
  return {
    html,
    matchId
  };
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

      // Retorna o HTML completo para o frontend processar via /api/match-details
      return res.status(200).json({
        success: true,
        matchId: matchId || 'unknown',
        html: html, // HTML completo
        message: 'HTML obtido com sucesso'
      });

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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Match, TeamStreaks, OpponentAnalysisMatch, ScopedStats } from '../types';

// Importa funções do match-details.ts dinamicamente
// Como não podemos fazer import direto, vamos copiar a lógica essencial

// Função para fazer fetch do HTML do site
// URL do serviço FastAPI de scraping (se configurado)
const SCRAPER_SERVICE_URL = process.env.SCRAPER_SERVICE_URL || '';

// Função auxiliar para criar AbortSignal com timeout (compatível com Node.js antigo)
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Limpa o timeout se o signal for abortado manualmente
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  
  return controller.signal;
}

async function fetchSiteHTML(url: string): Promise<string> {
  try {
    // Se o serviço FastAPI estiver configurado, usa ele primeiro
    if (SCRAPER_SERVICE_URL) {
      try {
        console.log('Tentando usar serviço FastAPI de scraping...');
        const scraperResponse = await fetch(`${SCRAPER_SERVICE_URL}/scrape?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: createTimeoutSignal(35000),
        });

        if (scraperResponse.ok) {
          const scraperData = await scraperResponse.json();
          if (scraperData.success && scraperData.html) {
            console.log('✅ HTML obtido via serviço FastAPI');
            return scraperData.html;
          } else {
            console.warn('Serviço FastAPI retornou erro:', scraperData.message);
            // Continua para tentar método direto
          }
        } else {
          console.warn('Serviço FastAPI não disponível, tentando método direto...');
          // Continua para tentar método direto
        }
      } catch (scraperError) {
        console.warn('Erro ao usar serviço FastAPI, tentando método direto:', scraperError);
        // Continua para tentar método direto
      }
    }

    // Método direto (fallback)
    console.log('Usando método direto de scraping...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
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
        throw new Error(`Acesso negado (403): O site está bloqueando requisições automáticas. Cole o HTML manualmente ou use a URL diretamente.`);
      }
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

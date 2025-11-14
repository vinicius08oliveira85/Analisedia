import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RenderRequest {
  url: string;
  wait_time?: number;
  wait_selector?: string;
  timeout?: number;
}

interface RenderResponse {
  success: boolean;
  html?: string;
  error?: string;
  url?: string;
  render_time_ms?: number;
}

// URL do serviço de renderização (pode ser configurada via env)
const RENDERER_SERVICE_URL = process.env.RENDERER_SERVICE_URL || 'http://localhost:8000';

// Função auxiliar para criar AbortSignal com timeout (compatível com Node.js antigo)
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Limpa o timeout se o signal for abortado manualmente
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  
  return controller.signal;
}

/**
 * Chama o serviço de renderização para obter HTML renderizado com JavaScript
 */
async function renderPageWithJS(url: string, options?: {
  waitTime?: number;
  waitSelector?: string;
  timeout?: number;
}): Promise<RenderResponse> {
  try {
    const response = await fetch(`${RENDERER_SERVICE_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        wait_time: options?.waitTime || 5000,
        wait_selector: options?.waitSelector,
        timeout: options?.timeout || 30000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao chamar serviço de renderização:', error);
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

  if (req.method === 'POST') {
    try {
      const { url, wait_time, wait_selector, timeout } = req.body as RenderRequest;

      if (!url) {
        return res.status(400).json({
          error: 'URL é obrigatória',
          message: 'Forneça a URL no body: { "url": "https://..." }'
        });
      }

      console.log(`[render-page] Renderizando URL: ${url}`);

      // Verifica se o serviço de renderização está disponível
      if (!RENDERER_SERVICE_URL || RENDERER_SERVICE_URL === 'http://localhost:8000') {
        console.warn('[render-page] RENDERER_SERVICE_URL não configurada, usando fallback');
        
        // Fallback: tenta fazer fetch normal (sem renderização JS)
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: createTimeoutSignal(timeout || 30000),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const html = await response.text();

          return res.status(200).json({
            success: true,
            html,
            url,
            message: 'HTML obtido (sem renderização JS - serviço não configurado)',
            warning: 'Serviço de renderização não configurado. Configure RENDERER_SERVICE_URL para renderizar JavaScript.'
          });
        } catch (fallbackError) {
          return res.status(500).json({
            success: false,
            error: `Serviço de renderização não configurado e fallback falhou: ${fallbackError instanceof Error ? fallbackError.message : 'Erro desconhecido'}`,
            message: 'Configure RENDERER_SERVICE_URL para renderizar sites com JavaScript'
          });
        }
      }

      // Chama o serviço de renderização
      const result = await renderPageWithJS(url, {
        waitTime: wait_time,
        waitSelector: wait_selector,
        timeout,
      });

      if (result.success && result.html) {
        return res.status(200).json({
          success: true,
          html: result.html,
          url: result.url || url,
          render_time_ms: result.render_time_ms,
          message: 'HTML renderizado com sucesso'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erro desconhecido ao renderizar',
          url: result.url || url
        });
      }

    } catch (error) {
      console.error('[render-page] Erro:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao renderizar página'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


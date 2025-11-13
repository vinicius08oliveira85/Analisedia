import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processMatchesHtml } from '../lib/matchExtractor';

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
      // Retorna os jogos processados
      // Em produção, você pode salvar em um banco de dados ou cache
      return res.status(200).json({ 
        message: 'Use POST para atualizar os jogos com dados HTML',
        endpoint: '/api/matches'
      });
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      return res.status(500).json({ error: 'Erro ao buscar jogos' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { html } = req.body;

      if (!html || typeof html !== 'string') {
        return res.status(400).json({ 
          error: 'É necessário fornecer o HTML no body: { "html": "..." }' 
        });
      }

      console.log('HTML recebido, tamanho:', html.length);
      
      const { matches, events, debug } = processMatchesHtml(html);
      
      console.log('Eventos extraídos:', events.length);
      console.log('Matches convertidos:', matches.length);
      console.log('Jogos ao vivo encontrados:', matches.filter(m => m.liveStatus?.isLive).length);
      console.log('Jogos com odds encontrados:', matches.filter(m => m.odds).length);

      if (events.length === 0 || matches.length === 0) {
        return res.status(400).json({ 
          error: 'Nenhum jogo encontrado no HTML fornecido',
          debug: {
            ...debug,
            sample: html.substring(0, 500)
          }
        });
      }

      // Aqui você pode salvar no banco de dados (Supabase) se necessário
      // Por enquanto, apenas retorna os dados processados

      return res.status(200).json({
        success: true,
        count: matches.length,
        matches,
        message: `${matches.length} jogos processados com sucesso`
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


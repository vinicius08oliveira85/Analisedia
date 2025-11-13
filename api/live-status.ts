import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { LiveMatchStatus, MatchOdds } from '../types';

// Função para extrair status ao vivo do HTML
function extractLiveStatus(html: string): LiveMatchStatus | null {
  const status: LiveMatchStatus = {
    isLive: false,
    status: 'scheduled',
    lastUpdated: new Date().toISOString()
  };

  // Procura por indicadores de jogo ao vivo
  const liveIndicators = [
    /ao\s+vivo/i,
    /live/i,
    /em\s+andamento/i,
    /jogando\s+agora/i,
    /status.*live/i,
    /minuto\s*\d+/i
  ];

  const isLive = liveIndicators.some(pattern => pattern.test(html));
  
  if (isLive) {
    status.isLive = true;
    status.status = 'live';
  }

  // Extrai minuto do jogo
  const minuteMatch = html.match(/(\d+)\s*['']?\s*(min|minuto)/i);
  if (minuteMatch) {
    status.minute = parseInt(minuteMatch[1]) || undefined;
  }

  // Verifica se está no intervalo
  if (html.match(/intervalo|half.?time|ht/i)) {
    status.status = 'halftime';
  }

  // Verifica se terminou
  if (html.match(/finalizado|terminado|finished|ft/i)) {
    status.status = 'finished';
    status.isLive = false;
  }

  // Extrai placar atual
  // Procura por padrões como "2-1", "2:1", etc.
  const scorePatterns = [
    /(\d+)\s*[-:]\s*(\d+)/g,
    /placar[:\s]+(\d+)\s*[-:]\s*(\d+)/i,
    /score[:\s]+(\d+)\s*[-:]\s*(\d+)/i
  ];

  for (const pattern of scorePatterns) {
    const match = html.match(pattern);
    if (match && match.length >= 3) {
      status.homeScore = parseInt(match[1]) || undefined;
      status.awayScore = parseInt(match[2]) || undefined;
      break;
    }
  }

  // Extrai placar do primeiro tempo (HT)
  const htScoreMatch = html.match(/ht[:\s]+(\d+)\s*[-:]\s*(\d+)/i);
  if (htScoreMatch) {
    status.homeScoreHT = parseInt(htScoreMatch[1]) || undefined;
    status.awayScoreHT = parseInt(htScoreMatch[2]) || undefined;
  }

  return status;
}

// Função para extrair odds do HTML
function extractOdds(html: string): MatchOdds | null {
  const odds: MatchOdds = {
    lastUpdated: new Date().toISOString()
  };

  // Procura por odds em diferentes formatos
  // Formato comum: "1.85", "2.50", "3.20"
  // Pode estar em tabelas, divs, ou elementos específicos

  // Padrão para odds de resultado (1X2)
  const oddsPatterns = {
    homeWin: [
      /casa[:\s]+(\d+\.?\d*)/i,
      /home[:\s]+(\d+\.?\d*)/i,
      /1[:\s]+(\d+\.?\d*)/,
      /vitória\s+casa[:\s]+(\d+\.?\d*)/i
    ],
    draw: [
      /empate[:\s]+(\d+\.?\d*)/i,
      /draw[:\s]+(\d+\.?\d*)/i,
      /x[:\s]+(\d+\.?\d*)/i,
      /e[:\s]+(\d+\.?\d*)/i
    ],
    awayWin: [
      /visitante[:\s]+(\d+\.?\d*)/i,
      /away[:\s]+(\d+\.?\d*)/i,
      /2[:\s]+(\d+\.?\d*)/,
      /vitória\s+visitante[:\s]+(\d+\.?\d*)/i
    ],
    over1_5: [
      /over\s*1\.5[:\s]+(\d+\.?\d*)/i,
      /acima\s*1\.5[:\s]+(\d+\.?\d*)/i,
      /mais\s*1\.5[:\s]+(\d+\.?\d*)/i
    ],
    under1_5: [
      /under\s*1\.5[:\s]+(\d+\.?\d*)/i,
      /abaixo\s*1\.5[:\s]+(\d+\.?\d*)/i,
      /menos\s*1\.5[:\s]+(\d+\.?\d*)/i
    ],
    over2_5: [
      /over\s*2\.5[:\s]+(\d+\.?\d*)/i,
      /acima\s*2\.5[:\s]+(\d+\.?\d*)/i,
      /mais\s*2\.5[:\s]+(\d+\.?\d*)/i
    ],
    under2_5: [
      /under\s*2\.5[:\s]+(\d+\.?\d*)/i,
      /abaixo\s*2\.5[:\s]+(\d+\.?\d*)/i,
      /menos\s*2\.5[:\s]+(\d+\.?\d*)/i
    ]
  };

  // Tenta extrair cada tipo de odd
  for (const [key, patterns] of Object.entries(oddsPatterns)) {
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        if (!isNaN(value) && value > 0) {
          (odds as any)[key] = value;
          break;
        }
      }
    }
  }

  // Procura por tabelas de odds
  // Muitos sites usam tabelas com classes específicas
  const oddsTableRegex = /<table[^>]*class="[^"]*odds[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  const tableMatches = html.matchAll(oddsTableRegex);
  
  for (const tableMatch of tableMatches) {
    const tableContent = tableMatch[1];
    // Procura por células com números que parecem odds (entre 1.0 e 10.0)
    const cellRegex = /<t[dh][^>]*>(\d+\.?\d*)<\/t[dh]>/gi;
    const cells: number[] = [];
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(tableContent)) !== null) {
      const value = parseFloat(cellMatch[1]);
      if (value >= 1.0 && value <= 10.0) {
        cells.push(value);
      }
    }
    
    // Se encontrou 3 valores, provavelmente são odds 1X2
    if (cells.length >= 3) {
      odds.homeWin = cells[0];
      odds.draw = cells[1];
      odds.awayWin = cells[2];
    }
    
    // Se encontrou mais valores, podem ser over/under
    if (cells.length >= 5) {
      odds.over1_5 = cells[3];
      odds.under1_5 = cells[4];
    }
    if (cells.length >= 7) {
      odds.over2_5 = cells[5];
      odds.under2_5 = cells[6];
    }
  }

  // Retorna null se não encontrou nenhuma odd
  if (!odds.homeWin && !odds.draw && !odds.awayWin && !odds.over1_5) {
    return null;
  }

  return odds;
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

  if (req.method === 'POST') {
    try {
      const { html, matchId } = req.body;

      if (!html || typeof html !== 'string') {
        return res.status(400).json({ 
          error: 'É necessário fornecer o HTML no body: { "html": "...", "matchId": "..." }' 
        });
      }

      console.log('Processando status ao vivo e odds para match:', matchId);

      // Extrai status ao vivo
      const liveStatus = extractLiveStatus(html);
      console.log('Status ao vivo extraído:', liveStatus);

      // Extrai odds
      const odds = extractOdds(html);
      console.log('Odds extraídas:', odds);

      return res.status(200).json({
        success: true,
        matchId,
        liveStatus: liveStatus || undefined,
        odds: odds || undefined,
        message: 'Status e odds atualizados com sucesso'
      });
    } catch (error) {
      console.error('Erro ao processar status ao vivo:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar status ao vivo e odds',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


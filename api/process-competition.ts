import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Standing, TeamGoalStats } from '../types';

interface CompetitionData {
  name: string;
  standings: Standing[];
  teamStats: Map<string, TeamGoalStats>;
  season?: string;
  country?: string;
}

// Função para normalizar nome do time
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Função para limpar texto HTML
function cleanHTMLText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para extrair nome da competição do HTML
function extractCompetitionName(html: string): string {
  // Tenta encontrar no título
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = cleanHTMLText(titleMatch[1]);
    // Remove partes comuns do título
    const cleaned = title
      .replace(/\s*-\s*Academia.*$/i, '')
      .replace(/\s*-\s*Estatísticas.*$/i, '')
      .trim();
    if (cleaned) return cleaned;
  }

  // Tenta encontrar em h1 ou h2
  const headingMatch = html.match(/<h[12][^>]*>([^<]+)<\/h[12]>/i);
  if (headingMatch) {
    return cleanHTMLText(headingMatch[1]);
  }

  return 'Competição Desconhecida';
}

// Função para extrair classificação da competição
function extractStandings(html: string): Standing[] {
  const standings: Standing[] = [];
  
  // Busca tabelas de classificação
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    
    // Verifica se é uma tabela de classificação (tem "Pos", "Time", "Pts", etc)
    if (!tableHtml.includes('Pos') && !tableHtml.includes('Pts') && !tableHtml.includes('Jogos')) {
      continue;
    }
    
    // Extrai linhas da tabela
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      
      // Extrai células
      const cells: string[] = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        cells.push(cleanHTMLText(cellMatch[1]));
      }
      
      if (cells.length >= 4) {
        // Tenta identificar colunas: Pos, Time, J, G, E, D, Pts, GP, GC
        let position = 0;
        let team = '';
        let points = 0;
        let played = 0;
        let wins = 0;
        let draws = 0;
        let losses = 0;
        
        // Primeira célula geralmente é a posição
        const posValue = parseInt(cells[0].replace(/[^0-9]/g, ''));
        if (posValue > 0 && posValue <= 50) {
          position = posValue;
        }
        
        // Busca nome do time (geralmente segunda ou terceira coluna)
        for (let i = 1; i < Math.min(cells.length, 5); i++) {
          const cell = cells[i];
          // Se não é número e tem texto, provavelmente é o nome do time
          if (!cell.match(/^\d+$/) && cell.length > 2) {
            team = cell;
            break;
          }
        }
        
        // Busca valores numéricos para estatísticas
        for (let i = 0; i < cells.length; i++) {
          const num = parseInt(cells[i].replace(/[^0-9]/g, ''));
          if (num > 0) {
            if (played === 0 && num <= 50) {
              played = num;
            } else if (wins === 0 && num <= played) {
              wins = num;
            } else if (draws === 0 && num <= played) {
              draws = num;
            } else if (losses === 0 && num <= played) {
              losses = num;
            } else if (points === 0 && num > 10) {
              points = num;
            }
          }
        }
        
        if (position > 0 && team) {
          standings.push({
            position,
            team,
            points: points || 0,
            played: played || 0,
            wins: wins || 0,
            draws: draws || 0,
            losses: losses || 0,
          });
        }
      }
    }
    
    // Se encontrou classificação, para de buscar
    if (standings.length > 0) {
      break;
    }
  }
  
  return standings;
}

// Função para extrair estatísticas de gols por time
function extractTeamGoalStats(html: string, teamName: string): TeamGoalStats | null {
  const defaultStats: TeamGoalStats = {
    avgGoalsScored: 0,
    avgGoalsConceded: 0,
    avgTotalGoals: 0,
    noGoalsScoredPct: 0,
    noGoalsConcededPct: 0,
    over25Pct: 0,
    under25Pct: 0,
    goalMoments: {
      scored: [0, 0, 0, 0, 0, 0],
      conceded: [0, 0, 0, 0, 0, 0]
    }
  };

  const normalizedTeam = normalizeTeamName(teamName);
  
  // Busca seção do time no HTML
  const teamSectionRegex = new RegExp(
    `(${teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,5000})`,
    'i'
  );
  
  const match = html.match(teamSectionRegex);
  if (!match) return null;
  
  const section = match[1];
  
  // Busca padrões de estatísticas de gols
  const patterns = [
    { key: 'avgGoalsScored', regex: /média[^0-9]*gols[^0-9]*marcados[^0-9]*([\d,]+)/i },
    { key: 'avgGoalsConceded', regex: /média[^0-9]*gols[^0-9]*sofridos[^0-9]*([\d,]+)/i },
    { key: 'over25Pct', regex: />[^0-9]*2[^0-9]*,?[^0-9]*5[^0-9]{0,200}([\d]+)[^0-9]*%/i },
    { key: 'under25Pct', regex: /<[^0-9]*2[^0-9]*,?[^0-9]*5[^0-9]{0,200}([\d]+)[^0-9]*%/i },
  ];
  
  for (const { key, regex } of patterns) {
    const match = section.match(regex);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(',', '.'));
      if (value > 0) {
        (defaultStats as any)[key] = value;
      }
    }
  }
  
  // Calcula média total
  if (defaultStats.avgTotalGoals === 0 && defaultStats.avgGoalsScored > 0 && defaultStats.avgGoalsConceded > 0) {
    defaultStats.avgTotalGoals = defaultStats.avgGoalsScored + defaultStats.avgGoalsConceded;
  }
  
  return defaultStats.avgGoalsScored > 0 || defaultStats.avgGoalsConceded > 0 ? defaultStats : null;
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
      const { html, url } = req.body;

      if (!html || typeof html !== 'string') {
        return res.status(400).json({ 
          error: 'É necessário fornecer o HTML: { "html": "...", "url": "..." (opcional) }' 
        });
      }

      console.log('[process-competition] Processando HTML da competição...');
      console.log('[process-competition] Tamanho do HTML:', html.length);

      // Extrai nome da competição
      const competitionName = extractCompetitionName(html);
      console.log('[process-competition] Nome da competição:', competitionName);

      // Extrai classificação
      const standings = extractStandings(html);
      console.log('[process-competition] Classificação extraída:', standings.length, 'times');

      // Extrai estatísticas de gols para cada time na classificação
      const teamStatsMap = new Map<string, TeamGoalStats>();
      for (const standing of standings) {
        const stats = extractTeamGoalStats(html, standing.team);
        if (stats) {
          teamStatsMap.set(standing.team, stats);
        }
      }

      console.log('[process-competition] Estatísticas de gols extraídas para', teamStatsMap.size, 'times');

      return res.status(200).json({
        success: true,
        data: {
          name: competitionName,
          standings: standings,
          teamStats: Object.fromEntries(teamStatsMap),
          url: url || undefined,
        },
        message: `Dados da competição "${competitionName}" extraídos com sucesso. ${standings.length} times encontrados.`
      });

    } catch (error) {
      console.error('[process-competition] Erro ao processar competição:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar HTML da competição',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


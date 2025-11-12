import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails, Match, Standing, TeamStreaks, OpponentAnalysisMatch } from '../types';

// Função para extrair dados de tabelas HTML
function extractTableData(html: string, tableClass: string): any[] {
  const regex = new RegExp(`<table[^>]*class="[^"]*${tableClass}[^"]*"[^>]*>([\\s\\S]*?)</table>`, 'gi');
  const matches = html.match(regex);
  if (!matches) return [];

  const results: any[] = [];
  for (const tableHtml of matches) {
    // Extrai linhas da tabela
    const rowRegex = /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = tableHtml.match(rowRegex) || [];
    
    for (const row of rows) {
      // Extrai células
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(row)) !== null) {
        const cellContent = cellMatch[1]
          .replace(/<[^>]+>/g, '') // Remove tags HTML
          .replace(/&nbsp;/g, ' ')
          .trim();
        cells.push(cellContent);
      }
      if (cells.length > 0) {
        results.push(cells);
      }
    }
  }
  return results;
}

// Função para extrair últimos jogos (stat-last10)
function extractLast10Matches(html: string, teamName: string): Match[] {
  const matches: Match[] = [];
  
  // Procura pela seção do time específico
  const teamSectionRegex = new RegExp(
    `<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>${teamName}[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
    'i'
  );
  
  const teamMatch = html.match(teamSectionRegex);
  if (!teamMatch) return matches;

  const tableHtml = teamMatch[1];
  const rowRegex = /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = tableHtml.match(rowRegex) || [];

  for (const row of rows.slice(1)) { // Pula o header
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      const cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      cells.push(cellContent);
    }

    if (cells.length >= 5) {
      const date = cells[0] || '';
      const competition = cells[1] || 'Brasileirão Série A';
      const homeTeam = cells[2] || '';
      const score = cells[3] || '0-0';
      const awayTeam = cells[4] || '';

      const [homeScore, awayScore] = score.split(':').map(s => parseInt(s.trim()) || 0);

      matches.push({
        date,
        competition,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore
      });
    }
  }

  return matches;
}

// Função para extrair sequências (stat-seqs)
function extractStreaks(html: string, teamName: string): TeamStreaks {
  const defaultStreaks: TeamStreaks = {
    winStreak: 0,
    drawStreak: 0,
    lossStreak: 0,
    unbeatenStreak: 0,
    winlessStreak: 0,
    noDrawStreak: 0
  };

  // Procura pela seção de sequências
  const streaksRegex = new RegExp(
    `Sequência[\\s\\S]*?${teamName}[\\s\\S]*?<table[^>]*class="[^"]*stat-seqs[^"]*"[^>]*>([\\s\\S]*?)</table>`,
    'i'
  );

  const match = html.match(streaksRegex);
  if (!match) return defaultStreaks;

  const tableHtml = match[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = tableHtml.match(rowRegex) || [];

  const streaks: TeamStreaks = { ...defaultStreaks };

  for (const row of rows) {
    const text = row.replace(/<[^>]+>/g, ' ').toLowerCase();
    
    if (text.includes('vitória') || text.includes('vitórias')) {
      const match = text.match(/(\d+)/);
      if (match) streaks.winStreak = parseInt(match[1]) || 0;
    }
    if (text.includes('empate') || text.includes('empates')) {
      const match = text.match(/(\d+)/);
      if (match) streaks.drawStreak = parseInt(match[1]) || 0;
    }
    if (text.includes('derrota') || text.includes('derrotas')) {
      const match = text.match(/(\d+)/);
      if (match) streaks.lossStreak = parseInt(match[1]) || 0;
    }
    if (text.includes('sem perder')) {
      const match = text.match(/(\d+)/);
      if (match) streaks.unbeatenStreak = parseInt(match[1]) || 0;
    }
    if (text.includes('sem vencer')) {
      const match = text.match(/(\d+)/);
      if (match) streaks.winlessStreak = parseInt(match[1]) || 0;
    }
    if (text.includes('sem empatar')) {
      const match = text.match(/(\d+)/);
      if (match) streaks.noDrawStreak = parseInt(match[1]) || 0;
    }
  }

  return streaks;
}

// Função para extrair análise classificativa (opponent analysis)
function extractOpponentAnalysis(html: string, teamName: string): OpponentAnalysisMatch[] {
  const analysis: OpponentAnalysisMatch[] = [];

  // Procura pela seção "Análise classificativa"
  const analysisRegex = new RegExp(
    `Análise classificativa[\\s\\S]*?${teamName}[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
    'i'
  );

  const match = html.match(analysisRegex);
  if (!match) return analysis;

  const tableHtml = match[1];
  const rowRegex = /<tr[^>]*class="[^"]*stat-quart-[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = tableHtml.match(rowRegex) || [];

  for (const row of rows) {
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      const cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      cells.push(cellContent);
    }

    if (cells.length >= 6) {
      const rankText = cells[0].replace(/[^\d]/g, '');
      const opponentRank = rankText ? parseInt(rankText) : 0;
      const homeTeam = cells[1] || '';
      const score = cells[2] || '0-0';
      const awayTeam = cells[3] || '';
      const awayRank = cells[4] || '';
      const firstGoal = cells[5] || '-';

      // Determina resultado
      const [homeScore, awayScore] = score.split(':').map(s => parseInt(s.trim()) || 0);
      let result: 'V' | 'E' | 'D' = 'E';
      if (homeTeam === teamName) {
        result = homeScore > awayScore ? 'V' : homeScore < awayScore ? 'D' : 'E';
      } else if (awayTeam === teamName) {
        result = awayScore > homeScore ? 'V' : awayScore < homeScore ? 'D' : 'E';
      }

      analysis.push({
        opponentRank,
        homeTeam,
        awayTeam,
        score: `${homeScore}-${awayScore}`,
        result,
        date: '', // Data não está disponível nesta tabela
        firstGoal
      });
    }
  }

  return analysis;
}

// Função para extrair confronto direto (stat-cd3)
function extractH2HMatches(html: string): Match[] {
  const matches: Match[] = [];

  const h2hRegex = /<table[^>]*class="[^"]*stat-cd3[^"]*"[^>]*>([\s\S]*?)<\/table>/i;
  const match = html.match(h2hRegex);
  if (!match) return matches;

  const tableHtml = match[1];
  const rowRegex = /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = tableHtml.match(rowRegex) || [];

  for (const row of rows.slice(1)) { // Pula o header
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      const cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      cells.push(cellContent);
    }

    if (cells.length >= 5) {
      const date = cells[0] || '';
      const competition = cells[1] || 'Brasileirão Série A';
      const homeTeam = cells[2] || '';
      const score = cells[3] || '0-0';
      const awayTeam = cells[4] || '';

      const [homeScore, awayScore] = score.split(':').map(s => parseInt(s.trim()) || 0);

      matches.push({
        date,
        competition,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore
      });
    }
  }

  return matches;
}

// Função para extrair informações básicas do jogo
function extractMatchInfo(html: string): { teamA: string; teamB: string; date: string; competition: string } | null {
  // Procura por JSON-LD
  const jsonScriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs;
  const scripts = html.match(jsonScriptRegex);
  
  if (scripts) {
    for (const script of scripts) {
      try {
        const jsonMatch = script.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data['@type'] === 'SportsEvent') {
            return {
              teamA: data.homeTeam?.name || '',
              teamB: data.awayTeam?.name || '',
              date: data.startDate || '',
              competition: data.location?.name?.split(' - ')[1] || data.location?.name || ''
            };
          }
        }
      } catch (e) {
        // Continua procurando
      }
    }
  }

  return null;
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

      // Extrai informações básicas
      const matchInfo = extractMatchInfo(html);
      if (!matchInfo) {
        return res.status(400).json({ 
          error: 'Não foi possível extrair informações básicas do jogo do HTML' 
        });
      }

      // Extrai dados detalhados
      const teamAForm = extractLast10Matches(html, matchInfo.teamA);
      const teamBForm = extractLast10Matches(html, matchInfo.teamB);
      const h2hData = extractH2HMatches(html);
      const teamAStreaks = extractStreaks(html, matchInfo.teamA);
      const teamBStreaks = extractStreaks(html, matchInfo.teamB);
      const teamAOpponentAnalysis = extractOpponentAnalysis(html, matchInfo.teamA);
      const teamBOpponentAnalysis = extractOpponentAnalysis(html, matchInfo.teamB);

      // Retorna os dados extraídos
      return res.status(200).json({
        success: true,
        matchId: matchId || 'unknown',
        data: {
          teamAForm,
          teamBForm,
          h2hData,
          teamAStreaks: {
            home: teamAStreaks,
            away: teamAStreaks, // Placeholder - seria necessário mais parsing
            global: teamAStreaks
          },
          teamBStreaks: {
            home: teamBStreaks,
            away: teamBStreaks,
            global: teamBStreaks
          },
          teamAOpponentAnalysis: {
            home: teamAOpponentAnalysis,
            away: [],
            global: teamAOpponentAnalysis
          },
          teamBOpponentAnalysis: {
            home: [],
            away: teamBOpponentAnalysis,
            global: teamBOpponentAnalysis
          }
        },
        message: 'Detalhes da partida processados com sucesso'
      });
    } catch (error) {
      console.error('Erro ao processar detalhes:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar detalhes da partida',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}


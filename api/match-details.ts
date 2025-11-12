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

// Função para normalizar nome do time (remove acentos, espaços, etc.)
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
    .trim();
}

// Função para encontrar nome do time no HTML (flexível)
function findTeamNameInHTML(html: string, searchName: string): string | null {
  const normalized = normalizeTeamName(searchName);
  
  // Procura por variações comuns do nome
  const variations = [
    searchName,
    searchName.replace(/-/g, ' '),
    searchName.replace(/-/g, ''),
    searchName.replace(/MG/g, 'Mineiro'),
    searchName.replace(/Mineiro/g, 'MG'),
  ];
  
  for (const variation of variations) {
    const regex = new RegExp(`<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]*${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*)</span>`, 'i');
    const match = html.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Função para extrair últimos jogos (stat-last10)
function extractLast10Matches(html: string, teamName: string): Match[] {
  const matches: Match[] = [];
  
  // Encontra o nome exato do time no HTML
  const actualTeamName = findTeamNameInHTML(html, teamName) || teamName;
  
  // Procura pela seção do time específico (mais flexível)
  const teamSectionRegex = new RegExp(
    `<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${actualTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
    'i'
  );
  
  const teamMatch = html.match(teamSectionRegex);
  if (!teamMatch) {
    // Tenta sem o nome do time, apenas procurando pela primeira tabela stat-last10
    const fallbackRegex = /<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\s\S]*?)<\/table>/i;
    const fallbackMatch = html.match(fallbackRegex);
    if (!fallbackMatch) return matches;
    return extractMatchesFromTable(fallbackMatch[1]);
  }

  return extractMatchesFromTable(teamMatch[1]);
}

// Função auxiliar para extrair jogos de uma tabela
function extractMatchesFromTable(tableHtml: string): Match[] {
  const matches: Match[] = [];
  const rowRegex = /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = tableHtml.match(rowRegex) || [];

  for (const row of rows) {
    // Pula linhas que não são de dados (header, footer, etc)
    if (row.includes('thead') || row.includes('Próximos jogos') || row.includes('next_matches_title')) {
      continue;
    }
    
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      let cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Extrai texto de links
      const linkMatch = cellContent.match(/<a[^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        cellContent = linkMatch[1].trim();
      }
      
      cells.push(cellContent);
    }

    if (cells.length >= 5) {
      const date = cells[0] || '';
      // Pula célula de competição (ícone/flag)
      const competition = 'Brasileirão Série A'; // Pode ser extraído da célula 1 se necessário
      const homeTeam = (cells[2] || '').trim();
      const scoreText = (cells[3] || '0-0').trim();
      const awayTeam = (cells[4] || '').trim();

      // Pula se for linha vazia ou próximos jogos
      if (!homeTeam && !awayTeam) continue;
      if (scoreText === '-' || scoreText === '') continue; // Próximos jogos

      // Extrai placar (pode estar em link)
      const scoreMatch = scoreText.match(/(\d+)[-:](\d+)/);
      if (!scoreMatch) continue;
      
      const homeScore = parseInt(scoreMatch[1]) || 0;
      const awayScore = parseInt(scoreMatch[2]) || 0;

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
function extractStreaks(html: string, teamName: string, scope: 'home' | 'away' | 'global' = 'home'): TeamStreaks {
  const defaultStreaks: TeamStreaks = {
    winStreak: 0,
    drawStreak: 0,
    lossStreak: 0,
    unbeatenStreak: 0,
    winlessStreak: 0,
    noDrawStreak: 0
  };

  // Encontra o nome exato do time no HTML
  const actualTeamName = findTeamNameInHTML(html, teamName) || teamName;
  
  // Procura pela seção de sequências do time específico
  const teamSectionRegex = new RegExp(
    `<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${actualTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-seqs[^"]*"[^>]*>([\\s\\S]*?)</table>`,
    'i'
  );

  const match = html.match(teamSectionRegex);
  if (!match) return defaultStreaks;

  const tableHtml = match[1];
  const rowRegex = /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = tableHtml.match(rowRegex) || [];

  const streaks: TeamStreaks = { ...defaultStreaks };
  
  // Determina qual coluna usar baseado no escopo
  // Colunas: [0] = Label, [1] = Casa, [2] = Fora, [3] = Global
  const colIndex = scope === 'home' ? 1 : scope === 'away' ? 2 : 3;

  for (const row of rows) {
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      const cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellContent);
    }

    if (cells.length > colIndex) {
      const label = (cells[0] || '').toLowerCase();
      const value = cells[colIndex] || '-';
      const numValue = value === '-' ? 0 : parseInt(value) || 0;
      
      if (label.includes('vitória') && label.includes('corrente')) {
        streaks.winStreak = numValue;
      } else if (label.includes('empate') && label.includes('corrente')) {
        streaks.drawStreak = numValue;
      } else if (label.includes('derrota') && label.includes('corrente')) {
        streaks.lossStreak = numValue;
      } else if (label.includes('sem perder')) {
        streaks.unbeatenStreak = numValue;
      } else if (label.includes('sem vencer')) {
        streaks.winlessStreak = numValue;
      } else if (label.includes('sem empatar')) {
        streaks.noDrawStreak = numValue;
      }
    }
  }

  return streaks;
}

// Função para extrair análise classificativa (opponent analysis) por contexto
function extractOpponentAnalysis(html: string, teamName: string, context: 'home' | 'away' | 'global' = 'home'): OpponentAnalysisMatch[] {
  const analysis: OpponentAnalysisMatch[] = [];

  // Encontra o nome exato do time no HTML
  const actualTeamName = findTeamNameInHTML(html, teamName) || teamName;
  
  // Para contexto global, procura na seção "Últimos 10 jogos"
  if (context === 'global') {
    const globalRegex = new RegExp(
      `Últimos 10 jogos[\\s\\S]*?<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${actualTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
      'i'
    );
    const globalMatch = html.match(globalRegex);
    if (globalMatch) {
      return extractAnalysisFromTable(globalMatch[1], actualTeamName);
    }
  }
  
  // Para contexto home/away, procura primeiro na seção "Análise classificativa"
  const analysisRegex = new RegExp(
    `Análise classificativa[\\s\\S]*?<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${actualTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
    'i'
  );

  let match = html.match(analysisRegex);
  
  // Se não encontrar na análise classificativa, tenta na seção "Todos os jogos na condição Casa/Fora"
  if (!match) {
    const allMatchesRegex = new RegExp(
      `Todos os jogos na condição Casa/Fora[\\s\\S]*?<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${actualTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
      'i'
    );
    match = html.match(allMatchesRegex);
  }
  
  if (!match) return analysis;
  
  // Extrai apenas jogos do contexto específico (Casa ou Fora)
  return extractAnalysisFromTable(match[1], actualTeamName, context);
}

// Função auxiliar para extrair análise de uma tabela
function extractAnalysisFromTable(tableHtml: string, teamName: string, context?: 'home' | 'away'): OpponentAnalysisMatch[] {
  const analysis: OpponentAnalysisMatch[] = [];

  const rowRegex = /<tr[^>]*class="[^"]*stat-quart-[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = tableHtml.match(rowRegex) || [];

  for (const row of rows) {
    // Pula linhas vazias
    if (row.trim().match(/^<tr[^>]*>[\s&nbsp;]*<\/tr>$/i)) continue;
    
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      let cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Extrai texto de links
      const linkMatch = cellContent.match(/<a[^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        cellContent = linkMatch[1].trim();
      }
      
      cells.push(cellContent);
    }

    if (cells.length >= 6) {
      const rankText = (cells[0] || '').replace(/[^\d]/g, '');
      const opponentRank = rankText ? parseInt(rankText) : 0;
      const homeTeam = (cells[1] || '').trim();
      const scoreText = (cells[2] || '0-0').trim();
      const awayTeam = (cells[3] || '').trim();
      const awayRankText = (cells[4] || '').replace(/[^\d]/g, '');
      const firstGoal = (cells[5] || '-').trim();

      // Pula se não tiver times válidos
      if (!homeTeam && !awayTeam) continue;
      
      // Extrai placar (pode estar em link)
      const scoreMatch = scoreText.match(/(\d+)[-:](\d+)/);
      if (!scoreMatch) continue;
      
      const homeScore = parseInt(scoreMatch[1]) || 0;
      const awayScore = parseInt(scoreMatch[2]) || 0;

      // Filtra por contexto se especificado
      const normalizedHomeTeam = normalizeTeamName(homeTeam);
      const normalizedAwayTeam = normalizeTeamName(awayTeam);
      const normalizedTeamName = normalizeTeamName(teamName);
      
      // Se contexto especificado, filtra apenas jogos onde o time está no contexto correto
      if (context === 'home' && normalizedHomeTeam !== normalizedTeamName) continue;
      if (context === 'away' && normalizedAwayTeam !== normalizedTeamName) continue;

      // Determina resultado baseado no time atual
      let result: 'V' | 'E' | 'D' = 'E';
      if (normalizedHomeTeam === normalizedTeamName) {
        result = homeScore > awayScore ? 'V' : homeScore < awayScore ? 'D' : 'E';
      } else if (normalizedAwayTeam === normalizedTeamName) {
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
      
      // Extrai streaks para cada escopo
      const teamAStreaksHome = extractStreaks(html, matchInfo.teamA, 'home');
      const teamAStreaksAway = extractStreaks(html, matchInfo.teamA, 'away');
      const teamAStreaksGlobal = extractStreaks(html, matchInfo.teamA, 'global');
      const teamBStreaksHome = extractStreaks(html, matchInfo.teamB, 'home');
      const teamBStreaksAway = extractStreaks(html, matchInfo.teamB, 'away');
      const teamBStreaksGlobal = extractStreaks(html, matchInfo.teamB, 'global');
      
      // Extrai análise classificativa para cada contexto
      const teamAOpponentAnalysisHome = extractOpponentAnalysis(html, matchInfo.teamA, 'home');
      const teamAOpponentAnalysisAway = extractOpponentAnalysis(html, matchInfo.teamA, 'away');
      const teamAOpponentAnalysisGlobal = extractOpponentAnalysis(html, matchInfo.teamA, 'global');
      const teamBOpponentAnalysisHome = extractOpponentAnalysis(html, matchInfo.teamB, 'home');
      const teamBOpponentAnalysisAway = extractOpponentAnalysis(html, matchInfo.teamB, 'away');
      const teamBOpponentAnalysisGlobal = extractOpponentAnalysis(html, matchInfo.teamB, 'global');

      // Logs de debug
      console.log('Extração de dados:', {
        teamA: matchInfo.teamA,
        teamB: matchInfo.teamB,
        teamAFormCount: teamAForm.length,
        teamBFormCount: teamBForm.length,
        h2hCount: h2hData.length,
        teamAStreaksHome,
        teamBStreaksAway,
        teamAAnalysisHomeCount: teamAOpponentAnalysisHome.length,
        teamAAnalysisAwayCount: teamAOpponentAnalysisAway.length,
        teamAAnalysisGlobalCount: teamAOpponentAnalysisGlobal.length,
        teamBAnalysisHomeCount: teamBOpponentAnalysisHome.length,
        teamBAnalysisAwayCount: teamBOpponentAnalysisAway.length,
        teamBAnalysisGlobalCount: teamBOpponentAnalysisGlobal.length
      });

      // Retorna os dados extraídos
      return res.status(200).json({
        success: true,
        matchId: matchId || 'unknown',
        data: {
          teamAForm,
          teamBForm,
          h2hData,
          teamAStreaks: {
            home: teamAStreaksHome,
            away: teamAStreaksAway,
            global: teamAStreaksGlobal
          },
          teamBStreaks: {
            home: teamBStreaksHome,
            away: teamBStreaksAway,
            global: teamBStreaksGlobal
          },
          teamAOpponentAnalysis: {
            home: teamAOpponentAnalysisHome,
            away: teamAOpponentAnalysisAway,
            global: teamAOpponentAnalysisGlobal
          },
          teamBOpponentAnalysis: {
            home: teamBOpponentAnalysisHome,
            away: teamBOpponentAnalysisAway,
            global: teamBOpponentAnalysisGlobal
          }
        },
        message: 'Detalhes da partida processados com sucesso',
        debug: {
          teamAFormCount: teamAForm.length,
          teamBFormCount: teamBForm.length,
          h2hCount: h2hData.length,
          teamAAnalysisHomeCount: teamAOpponentAnalysisHome.length,
          teamAAnalysisAwayCount: teamAOpponentAnalysisAway.length,
          teamAAnalysisGlobalCount: teamAOpponentAnalysisGlobal.length,
          teamBAnalysisHomeCount: teamBOpponentAnalysisHome.length,
          teamBAnalysisAwayCount: teamBOpponentAnalysisAway.length,
          teamBAnalysisGlobalCount: teamBOpponentAnalysisGlobal.length
        }
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


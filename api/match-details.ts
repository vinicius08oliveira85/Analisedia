import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails, Match, Standing, TeamStreaks, OpponentAnalysisMatch, ScopedStats } from '../types';

// Função auxiliar para criar streaks padrão
function defaultStreaks(): TeamStreaks {
  return {
    winStreak: 0,
    drawStreak: 0,
    lossStreak: 0,
    unbeatenStreak: 0,
    winlessStreak: 0,
    noDrawStreak: 0
  };
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

// Extrai TODAS as tabelas de form (Últimos 10 jogos) pela estrutura com nomes
function extractAllFormTablesWithNames(html: string): Array<{ teamName: string; matches: Match[] }> {
  const results: Array<{ teamName: string; matches: Match[] }> = [];
  
  // Busca todas as tabelas stat-last10 com seus subtitles (mais flexível)
  // Procura por qualquer span stats-subtitle seguido de table stat-last10
  const tableRegex = /<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  
  let match;
  while ((match = tableRegex.exec(html)) !== null) {
    const teamName = match[1].trim();
    const tableHtml = match[2];
    
    // Verifica se é uma tabela de form (tem colunas Data, Casa, Fora, etc)
    if (tableHtml.includes('stats-wd-date') || tableHtml.includes('stats-wd-teamname')) {
      const matches = extractMatchesFromTable(tableHtml);
      // Evita duplicatas
      const exists = results.some(r => normalizeTeamName(r.teamName) === normalizeTeamName(teamName));
      if (!exists) {
        results.push({ teamName, matches });
      }
    }
  }
  
  return results;
}

// Função auxiliar para encontrar tabela de form para um time específico
function findTableForTeam(tables: Array<{ teamName: string; matches: Match[] }>, searchTeam: string): Match[] | null {
  const searchNormalized = normalizeTeamName(searchTeam);
  
  for (const table of tables) {
    const foundNormalized = normalizeTeamName(table.teamName);
    if (foundNormalized === searchNormalized || 
        foundNormalized.includes(searchNormalized) || 
        searchNormalized.includes(foundNormalized)) {
      return table.matches;
    }
  }
  
  return null;
}

// Extrai TODAS as tabelas de streaks pela estrutura com nomes
function extractAllStreaksTablesWithNames(html: string): Array<{ teamName: string; streaks: ScopedStats<TeamStreaks> }> {
  const results: Array<{ teamName: string; streaks: ScopedStats<TeamStreaks> }> = [];
  
  // Busca todas as tabelas stat-seqs com seus subtitles (mais flexível)
  // Procura por qualquer span stats-subtitle seguido de table stat-seqs
  const tableRegex = /<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*stat-seqs[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  
  let match;
  while ((match = tableRegex.exec(html)) !== null) {
    const teamName = match[1].trim();
    const tableHtml = match[2];
    
    // Verifica se é uma tabela de streaks (tem "Sequência de Vitórias" ou "Não perde há")
    if (tableHtml.includes('Sequência de') || tableHtml.includes('Não perde') || tableHtml.includes('Não ganha') || tableHtml.includes('Não empata')) {
      const streaks = extractStreaksFromTable(tableHtml);
      // Evita duplicatas
      const exists = results.some(r => normalizeTeamName(r.teamName) === normalizeTeamName(teamName));
      if (!exists) {
        results.push({ teamName, streaks });
      }
    }
  }
  
  return results;
}

// Função auxiliar para encontrar streaks para um time específico
function findStreaksForTeam(tables: Array<{ teamName: string; streaks: ScopedStats<TeamStreaks> }>, searchTeam: string): ScopedStats<TeamStreaks> | null {
  const searchNormalized = normalizeTeamName(searchTeam);
  
  for (const table of tables) {
    const foundNormalized = normalizeTeamName(table.teamName);
    if (foundNormalized === searchNormalized || 
        foundNormalized.includes(searchNormalized) || 
        searchNormalized.includes(foundNormalized)) {
      return table.streaks;
    }
  }
  
  return null;
}

// Extrai streaks de uma tabela específica
function extractStreaksFromTable(tableHtml: string): ScopedStats<TeamStreaks> {
  const homeStreaks = defaultStreaks();
  const awayStreaks = defaultStreaks();
  const globalStreaks = defaultStreaks();
  
  // Remove o thead se existir
  const tbodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const contentToParse = tbodyMatch ? tbodyMatch[1] : tableHtml;
  
  const rowRegex = /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = contentToParse.match(rowRegex) || [];

  for (const row of rows) {
    if (row.includes('<thead') || row.includes('</thead>')) continue;
    
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      let cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellContent);
    }

    if (cells.length >= 4) {
      const label = (cells[0] || '').toLowerCase();
      const homeValue = (cells[1] || '-').trim();
      const awayValue = (cells[2] || '-').trim();
      const globalValue = (cells[3] || '-').trim();
      
      const homeNum = homeValue === '-' || homeValue === '' ? 0 : parseInt(homeValue) || 0;
      const awayNum = awayValue === '-' || awayValue === '' ? 0 : parseInt(awayValue) || 0;
      const globalNum = globalValue === '-' || globalValue === '' ? 0 : parseInt(globalValue) || 0;
      
      if (label.includes('vitória') && label.includes('corrente')) {
        homeStreaks.winStreak = homeNum;
        awayStreaks.winStreak = awayNum;
        globalStreaks.winStreak = globalNum;
      } else if (label.includes('empate') && label.includes('corrente')) {
        homeStreaks.drawStreak = homeNum;
        awayStreaks.drawStreak = awayNum;
        globalStreaks.drawStreak = globalNum;
      } else if (label.includes('derrota') && label.includes('corrente')) {
        homeStreaks.lossStreak = homeNum;
        awayStreaks.lossStreak = awayNum;
        globalStreaks.lossStreak = globalNum;
      } else if (label.includes('não perde') || label.includes('sem perder')) {
        homeStreaks.unbeatenStreak = homeNum;
        awayStreaks.unbeatenStreak = awayNum;
        globalStreaks.unbeatenStreak = globalNum;
      } else if (label.includes('não ganha') || label.includes('sem vencer')) {
        homeStreaks.winlessStreak = homeNum;
        awayStreaks.winlessStreak = awayNum;
        globalStreaks.winlessStreak = globalNum;
      } else if (label.includes('não empata') || label.includes('sem empatar')) {
        homeStreaks.noDrawStreak = homeNum;
        awayStreaks.noDrawStreak = awayNum;
        globalStreaks.noDrawStreak = globalNum;
      }
    }
  }

  return {
    home: homeStreaks,
    away: awayStreaks,
    global: globalStreaks
  };
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

// Extrai TODAS as tabelas de análise classificativa pela estrutura com nomes
function extractAllAnalysisTablesWithNames(html: string): Array<{ teamName: string; analysis: ScopedStats<OpponentAnalysisMatch[]> }> {
  const results: Array<{ teamName: string; analysis: ScopedStats<OpponentAnalysisMatch[]> }> = [];
  
  // Busca seções de análise classificativa e "Todos os jogos na condição Casa/Fora"
  // Procura primeiro pela seção, depois pelas tabelas dentro dela
  const sectionRegex = /(?:Análise classificativa|Todos os jogos na condição Casa\/Fora)[\s\S]*?<tr>[\s\S]*?<td[^>]*class="[^"]*mobile_single_column[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  
  let match;
  const tablesByTeam: { [key: string]: string } = {};
  
  while ((match = sectionRegex.exec(html)) !== null) {
    const teamName = match[1].trim();
    const tableHtml = match[2];
    
    // Verifica se é uma tabela de análise (tem colunas de ranking, placar, etc)
    if (tableHtml.includes('stat-quart-') || tableHtml.includes('stats-wd-ranking')) {
      if (!tablesByTeam[teamName]) {
        tablesByTeam[teamName] = tableHtml;
      } else {
        // Se já existe, concatena (pode ter múltiplas seções)
        tablesByTeam[teamName] += '\n' + tableHtml;
      }
    }
  }
  
  // Se não encontrou nada nas seções específicas, busca diretamente por tabelas stat-last10 com stat-quart
  if (Object.keys(tablesByTeam).length === 0) {
    const directRegex = /<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
    while ((match = directRegex.exec(html)) !== null) {
      const teamName = match[1].trim();
      const tableHtml = match[2];
      
      // Verifica se é uma tabela de análise (tem stat-quart ou ranking)
      if (tableHtml.includes('stat-quart-') || tableHtml.includes('stats-wd-ranking')) {
        if (!tablesByTeam[teamName]) {
          tablesByTeam[teamName] = tableHtml;
        } else {
          tablesByTeam[teamName] += '\n' + tableHtml;
        }
      }
    }
  }
  
  // Extrai análise para cada time encontrado
  const teamNames = Object.keys(tablesByTeam);
  for (const teamName of teamNames) {
    const tableHtml = tablesByTeam[teamName];
    const homeAnalysis = extractAnalysisFromTable(tableHtml, teamName, 'home');
    const awayAnalysis = extractAnalysisFromTable(tableHtml, teamName, 'away');
    const globalAnalysis = extractAnalysisFromTable(tableHtml, teamName);
    
    results.push({
      teamName,
      analysis: {
        home: homeAnalysis,
        away: awayAnalysis,
        global: globalAnalysis
      }
    });
  }
  
  return results;
}

// Função auxiliar para encontrar análise para um time específico
function findAnalysisForTeam(tables: Array<{ teamName: string; analysis: ScopedStats<OpponentAnalysisMatch[]> }>, searchTeam: string): ScopedStats<OpponentAnalysisMatch[]> | null {
  const searchNormalized = normalizeTeamName(searchTeam);
  
  for (const table of tables) {
    const foundNormalized = normalizeTeamName(table.teamName);
    if (foundNormalized === searchNormalized || 
        foundNormalized.includes(searchNormalized) || 
        searchNormalized.includes(foundNormalized)) {
      return table.analysis;
    }
  }
  
  return null;
}

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
    searchName.replace(/Atlético/gi, 'Atletico'),
    searchName.replace(/Atletico/gi, 'Atlético'),
  ];
  
  // Primeiro tenta match exato ou parcial
  for (const variation of variations) {
    const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]*${escaped}[^<]*)</span>`, 'i');
    const match = html.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Se não encontrou, tenta match normalizado (sem acentos, espaços, etc)
  const allSubtitles = html.matchAll(/<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>/gi);
  for (const match of allSubtitles) {
    const foundName = match[1].trim();
    const foundNormalized = normalizeTeamName(foundName);
    if (foundNormalized === normalized || foundNormalized.includes(normalized) || normalized.includes(foundNormalized)) {
      return foundName;
    }
  }
  
  return null;
}

// Função para extrair últimos jogos (stat-last10)
function extractLast10Matches(html: string, teamName: string): Match[] {
  const matches: Match[] = [];
  
  console.log(`[extractLast10Matches] Buscando form para: ${teamName}`);
  
  // Encontra o nome exato do time no HTML
  const actualTeamName = findTeamNameInHTML(html, teamName);
  console.log(`[extractLast10Matches] Nome encontrado no HTML: ${actualTeamName || 'NÃO ENCONTRADO'}`);
  
  const searchName = actualTeamName || teamName;
  
  // Procura pela seção do time específico (mais flexível)
  let teamMatch: RegExpMatchArray | null = null;
  
  if (searchName) {
    const escaped = searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const teamSectionRegex = new RegExp(
      `<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${escaped}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
      'i'
    );
    teamMatch = html.match(teamSectionRegex);
    console.log(`[extractLast10Matches] Estratégia 1 (regex direto): ${teamMatch ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
  }
  
  // Estratégia 2: Busca todas as tabelas stat-last10 e identifica qual é do time
  if (!teamMatch) {
    const searchNormalized = normalizeTeamName(teamName);
    console.log(`[extractLast10Matches] Estratégia 2: Buscando todas as tabelas. Nome normalizado: ${searchNormalized}`);
    
    const allLast10Tables = html.matchAll(/<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\s\S]*?)<\/table>/gi);
    let foundCount = 0;
    for (const last10Match of allLast10Tables) {
      foundCount++;
      const foundTeamName = last10Match[1].trim();
      const foundNormalized = normalizeTeamName(foundTeamName);
      console.log(`[extractLast10Matches] Tabela ${foundCount}: "${foundTeamName}" (normalizado: ${foundNormalized})`);
      
      if (foundNormalized === searchNormalized || 
          foundNormalized.includes(searchNormalized) || 
          searchNormalized.includes(foundNormalized)) {
        teamMatch = last10Match;
        console.log(`[extractLast10Matches] MATCH ENCONTRADO na tabela ${foundCount}!`);
        break;
      }
    }
    console.log(`[extractLast10Matches] Total de tabelas encontradas: ${foundCount}`);
  }
  
  if (!teamMatch || !teamMatch[teamMatch.length - 1]) {
    console.log(`[extractLast10Matches] NENHUMA tabela encontrada para ${teamName}`);
    return matches;
  }

  const extracted = extractMatchesFromTable(teamMatch[teamMatch.length - 1]);
  console.log(`[extractLast10Matches] Extraídos ${extracted.length} jogos da tabela`);
  return extracted;
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

  console.log(`[extractStreaks] Buscando streaks para: ${teamName} (scope: ${scope})`);

  // Encontra o nome exato do time no HTML
  const actualTeamName = findTeamNameInHTML(html, teamName);
  console.log(`[extractStreaks] Nome encontrado no HTML: ${actualTeamName || 'NÃO ENCONTRADO'}`);
  
  const searchName = actualTeamName || teamName;
  
  // Procura pela seção de sequências do time específico
  // Tenta múltiplas estratégias
  let match: RegExpMatchArray | null = null;
  
  // Estratégia 1: Busca com nome encontrado
  if (searchName) {
    const escaped = searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const teamSectionRegex = new RegExp(
      `<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${escaped}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-seqs[^"]*"[^>]*>([\\s\\S]*?)</table>`,
      'i'
    );
    match = html.match(teamSectionRegex);
    console.log(`[extractStreaks] Estratégia 1 (regex direto): ${match ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
  }
  
  // Estratégia 2: Busca todas as tabelas stat-seqs e identifica qual é do time
  if (!match) {
    const searchNormalized = normalizeTeamName(teamName);
    console.log(`[extractStreaks] Estratégia 2: Buscando todas as tabelas. Nome normalizado: ${searchNormalized}`);
    
    const allSeqsTables = html.matchAll(/<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*stat-seqs[^"]*"[^>]*>([\s\S]*?)<\/table>/gi);
    let foundCount = 0;
    for (const seqMatch of allSeqsTables) {
      foundCount++;
      const foundTeamName = seqMatch[1].trim();
      const foundNormalized = normalizeTeamName(foundTeamName);
      console.log(`[extractStreaks] Tabela ${foundCount}: "${foundTeamName}" (normalizado: ${foundNormalized})`);
      
      if (foundNormalized === searchNormalized || 
          foundNormalized.includes(searchNormalized) || 
          searchNormalized.includes(foundNormalized)) {
        match = seqMatch;
        console.log(`[extractStreaks] MATCH ENCONTRADO na tabela ${foundCount}!`);
        break;
      }
    }
    console.log(`[extractStreaks] Total de tabelas encontradas: ${foundCount}`);
  }
  
  if (!match || !match[match.length - 1]) {
    console.log(`[extractStreaks] NENHUMA tabela encontrada para ${teamName}`);
    return defaultStreaks;
  }

  const tableHtml = match[match.length - 1];
  
  // Remove o thead se existir
  const tbodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const contentToParse = tbodyMatch ? tbodyMatch[1] : tableHtml;
  
  const rowRegex = /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = contentToParse.match(rowRegex) || [];

  const streaks: TeamStreaks = { ...defaultStreaks };
  
  // Determina qual coluna usar baseado no escopo
  // Colunas: [0] = Label, [1] = Casa, [2] = Fora, [3] = Global
  const colIndex = scope === 'home' ? 1 : scope === 'away' ? 2 : 3;

  for (const row of rows) {
    // Pula o thead se ainda estiver presente
    if (row.includes('<thead') || row.includes('</thead>')) continue;
    
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      let cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellContent);
    }

    if (cells.length > colIndex) {
      const label = (cells[0] || '').toLowerCase();
      const value = (cells[colIndex] || '-').trim();
      const numValue = value === '-' || value === '' ? 0 : parseInt(value) || 0;
      
      if (label.includes('vitória') && label.includes('corrente')) {
        streaks.winStreak = numValue;
      } else if (label.includes('empate') && label.includes('corrente')) {
        streaks.drawStreak = numValue;
      } else if (label.includes('derrota') && label.includes('corrente')) {
        streaks.lossStreak = numValue;
      } else if (label.includes('não perde') || label.includes('sem perder')) {
        streaks.unbeatenStreak = numValue;
      } else if (label.includes('não ganha') || label.includes('sem vencer')) {
        streaks.winlessStreak = numValue;
      } else if (label.includes('não empata') || label.includes('sem empatar')) {
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
  let match: RegExpMatchArray | null = null;
  
  if (actualTeamName) {
    const escaped = actualTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const analysisRegex = new RegExp(
      `Análise classificativa[\\s\\S]*?<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${escaped}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
      'i'
    );
    match = html.match(analysisRegex);
  }
  
  // Se não encontrar na análise classificativa, tenta na seção "Todos os jogos na condição Casa/Fora"
  if (!match && actualTeamName) {
    const escaped = actualTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const allMatchesRegex = new RegExp(
      `Todos os jogos na condição Casa/Fora[\\s\\S]*?<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>[^<]*${escaped}[^<]*</span>[\\s\\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\\s\\S]*?)</table>`,
      'i'
    );
    match = html.match(allMatchesRegex);
  }
  
  // Estratégia 3: Busca todas as tabelas e identifica qual é do time
  if (!match) {
    const searchNormalized = normalizeTeamName(teamName);
    const allAnalysisTables = html.matchAll(/(?:Análise classificativa|Todos os jogos na condição Casa\/Fora)[\s\S]*?<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*stat-last10[^"]*"[^>]*>([\s\S]*?)<\/table>/gi);
    for (const analysisMatch of allAnalysisTables) {
      const foundTeamName = analysisMatch[1].trim();
      const foundNormalized = normalizeTeamName(foundTeamName);
      
      if (foundNormalized === searchNormalized || 
          foundNormalized.includes(searchNormalized) || 
          searchNormalized.includes(foundNormalized)) {
        match = analysisMatch;
        break;
      }
    }
  }
  
  if (!match || !match[match.length - 1]) return analysis;
  
  // Extrai apenas jogos do contexto específico (Casa ou Fora)
  return extractAnalysisFromTable(match[match.length - 1], actualTeamName, context);
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

      console.log('Match Info extraído:', matchInfo);

      // NOVA ABORDAGEM: Extrai todas as informações diretamente do HTML pela estrutura
      // Identifica qual tabela pertence a qual time pelo nome encontrado no HTML
      
      // 1. Extrai todas as tabelas de "Últimos 10 jogos" (Form) e identifica qual é de qual time
      const allFormTables = extractAllFormTablesWithNames(html);
      const teamAForm = findTableForTeam(allFormTables, matchInfo.teamA) || [];
      const teamBForm = findTableForTeam(allFormTables, matchInfo.teamB) || [];
      console.log(`Form extraído: Time A (${matchInfo.teamA}) = ${teamAForm.length}, Time B (${matchInfo.teamB}) = ${teamBForm.length}`);
      
      // 2. Extrai todas as tabelas de streaks e identifica qual é de qual time
      const allStreaksTables = extractAllStreaksTablesWithNames(html);
      const teamAStreaks = findStreaksForTeam(allStreaksTables, matchInfo.teamA) || { home: defaultStreaks(), away: defaultStreaks(), global: defaultStreaks() };
      const teamBStreaks = findStreaksForTeam(allStreaksTables, matchInfo.teamB) || { home: defaultStreaks(), away: defaultStreaks(), global: defaultStreaks() };
      console.log(`Streaks extraídos: Time A =`, teamAStreaks);
      console.log(`Streaks extraídos: Time B =`, teamBStreaks);
      
      // 3. Extrai todas as tabelas de análise classificativa e identifica qual é de qual time
      const allAnalysisTables = extractAllAnalysisTablesWithNames(html);
      const teamAOpponentAnalysis = findAnalysisForTeam(allAnalysisTables, matchInfo.teamA) || { home: [], away: [], global: [] };
      const teamBOpponentAnalysis = findAnalysisForTeam(allAnalysisTables, matchInfo.teamB) || { home: [], away: [], global: [] };
      console.log(`Análise extraída: Time A =`, {
        home: teamAOpponentAnalysis.home.length,
        away: teamAOpponentAnalysis.away.length,
        global: teamAOpponentAnalysis.global.length
      });
      console.log(`Análise extraída: Time B =`, {
        home: teamBOpponentAnalysis.home.length,
        away: teamBOpponentAnalysis.away.length,
        global: teamBOpponentAnalysis.global.length
      });
      
      // 4. Extrai H2H
      const h2hData = extractH2HMatches(html);
      console.log(`H2H: ${h2hData.length} jogos extraídos`);

      // Retorna os dados extraídos
      return res.status(200).json({
        success: true,
        matchId: matchId || 'unknown',
        data: {
          teamAForm,
          teamBForm,
          h2hData,
          teamAStreaks,
          teamBStreaks,
          teamAOpponentAnalysis,
          teamBOpponentAnalysis
        },
        message: 'Detalhes da partida processados com sucesso',
        debug: {
          teamAFormCount: teamAForm.length,
          teamBFormCount: teamBForm.length,
          h2hCount: h2hData.length,
          teamAAnalysisHomeCount: teamAOpponentAnalysis.home.length,
          teamAAnalysisAwayCount: teamAOpponentAnalysis.away.length,
          teamAAnalysisGlobalCount: teamAOpponentAnalysis.global.length,
          teamBAnalysisHomeCount: teamBOpponentAnalysis.home.length,
          teamBAnalysisAwayCount: teamBOpponentAnalysis.away.length,
          teamBAnalysisGlobalCount: teamBOpponentAnalysis.global.length
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


import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MatchDetails, Match, Standing, TeamStreaks, OpponentAnalysisMatch, ScopedStats, TeamGoalStats } from '../types';

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
  if (!name) return '';
  
  let normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
  
  // Mapeia variações comuns de nomes de times brasileiros
  const variations: { [key: string]: string } = {
    'atletico-mg': 'atleticomineiro',
    'atletico mg': 'atleticomineiro',
    'atletico mineiro': 'atleticomineiro',
    'atletico': 'atleticomineiro',
    'flamengo': 'flamengo',
    'fluminense': 'fluminense',
    'corinthians': 'corinthians',
    'palmeiras': 'palmeiras',
    'sao paulo': 'saopaulo',
    'santos': 'santos',
    'gremio': 'gremio',
    'internacional': 'internacional',
    'cruzeiro': 'cruzeiro',
    'botafogo': 'botafogo',
    'vasco': 'vascodagama',
    'vascodagama': 'vascodagama',
    'fortaleza': 'fortaleza',
    'athletico': 'athleticoparanaense',
    'athletico paranaense': 'athleticoparanaense',
    'athletico-pr': 'athleticoparanaense',
    'athletico pr': 'athleticoparanaense',
    // Times internacionais comuns
    'franca': 'franca',
    'france': 'franca',
    'ucrania': 'ucrania',
    'ukraine': 'ucrania',
    'brasil': 'brasil',
    'brazil': 'brasil',
    'argentina': 'argentina',
    'portugal': 'portugal',
    'espanha': 'espanha',
    'spain': 'espanha',
    'italia': 'italia',
    'italy': 'italia',
    'alemanha': 'alemanha',
    'germany': 'alemanha',
    'inglaterra': 'inglaterra',
    'england': 'inglaterra',
  };
  
  // Remove caracteres especiais para comparação
  const cleaned = normalized.replace(/[^a-z0-9]/g, '');
  
  // Verifica se há uma variação conhecida
  for (const [key, value] of Object.entries(variations)) {
    const keyCleaned = key.replace(/[^a-z0-9]/g, '');
    if (cleaned === keyCleaned || cleaned.includes(keyCleaned) || keyCleaned.includes(cleaned)) {
      return value;
    }
  }
  
  // Se não encontrou variação, retorna limpo
  return cleaned;
}

function cleanHTMLText(value: string): string {
  if (!value) return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLabelText(value: string): string {
  return cleanHTMLText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseNumericValue(value: string): number {
  const cleaned = cleanHTMLText(value).replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseIntegerValue(value: string): number {
  const parsed = parseNumericValue(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function getScopeLabel(scope: 'home' | 'away' | 'global'): string {
  if (scope === 'home') return 'Casa';
  if (scope === 'away') return 'Fora';
  return 'Global';
}

function getScopeIndex(scope: 'home' | 'away' | 'global', totalColumns: number): number {
  if (scope === 'home') return totalColumns > 1 ? 1 : totalColumns - 1;
  if (scope === 'away') return totalColumns > 2 ? 2 : totalColumns - 1;
  return totalColumns > 3 ? 3 : totalColumns - 1;
}

const GOAL_INTERVALS = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'];

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
      const competition = cells[1] || 'Competição desconhecida';
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
  if (!searchTeam) return null;
  
  const searchNormalized = normalizeTeamName(searchTeam);
  console.log(`  Procurando tabela para: "${searchTeam}" (normalizado: "${searchNormalized}")`);
  
  // Primeira tentativa: match exato ou parcial
  for (const table of tables) {
    const foundNormalized = normalizeTeamName(table.teamName);
    console.log(`    Comparando com: "${table.teamName}" (normalizado: "${foundNormalized}")`);
    
    if (foundNormalized === searchNormalized || 
        foundNormalized.includes(searchNormalized) || 
        searchNormalized.includes(foundNormalized)) {
      console.log(`    ✓ Match encontrado!`);
      return table.matches;
    }
  }
  
  // Segunda tentativa: comparação mais flexível (primeiras 3-4 letras)
  if (searchNormalized.length >= 3) {
    const searchPrefix = searchNormalized.substring(0, Math.min(4, searchNormalized.length));
    for (const table of tables) {
      const foundNormalized = normalizeTeamName(table.teamName);
      if (foundNormalized.startsWith(searchPrefix) || searchNormalized.startsWith(foundNormalized.substring(0, Math.min(4, foundNormalized.length)))) {
        console.log(`    ✓ Match encontrado (prefixo)!`);
        return table.matches;
      }
    }
  }
  
  // Terceira tentativa: busca por palavras-chave (para nomes compostos)
  const searchWords = searchNormalized.split(/(?<=[a-z])(?=[a-z])/).filter(w => w.length >= 3);
  for (const table of tables) {
    const foundNormalized = normalizeTeamName(table.teamName);
    const foundWords = foundNormalized.split(/(?<=[a-z])(?=[a-z])/).filter(w => w.length >= 3);
    
    // Verifica se pelo menos uma palavra coincide
    const hasCommonWord = searchWords.some(sw => foundWords.some(fw => fw.includes(sw) || sw.includes(fw)));
    if (hasCommonWord && searchWords.length > 0) {
      console.log(`    ✓ Match encontrado (palavra-chave)!`);
      return table.matches;
    }
  }
  
  console.log(`    ✗ Nenhum match encontrado`);
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
  if (!searchTeam) return null;
  
  const searchNormalized = normalizeTeamName(searchTeam);
  
  // Primeira tentativa: match exato ou parcial
  for (const table of tables) {
    const foundNormalized = normalizeTeamName(table.teamName);
    if (foundNormalized === searchNormalized || 
        foundNormalized.includes(searchNormalized) || 
        searchNormalized.includes(foundNormalized)) {
      return table.streaks;
    }
  }
  
  // Segunda tentativa: comparação por prefixo
  if (searchNormalized.length >= 3) {
    const searchPrefix = searchNormalized.substring(0, Math.min(4, searchNormalized.length));
    for (const table of tables) {
      const foundNormalized = normalizeTeamName(table.teamName);
      if (foundNormalized.startsWith(searchPrefix) || searchNormalized.startsWith(foundNormalized.substring(0, Math.min(4, foundNormalized.length)))) {
        return table.streaks;
      }
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
  if (!searchTeam) return null;
  
  const searchNormalized = normalizeTeamName(searchTeam);
  
  // Primeira tentativa: match exato ou parcial
  for (const table of tables) {
    const foundNormalized = normalizeTeamName(table.teamName);
    if (foundNormalized === searchNormalized || 
        foundNormalized.includes(searchNormalized) || 
        searchNormalized.includes(foundNormalized)) {
      return table.analysis;
    }
  }
  
  // Segunda tentativa: comparação por prefixo
  if (searchNormalized.length >= 3) {
    const searchPrefix = searchNormalized.substring(0, Math.min(4, searchNormalized.length));
    for (const table of tables) {
      const foundNormalized = normalizeTeamName(table.teamName);
      if (foundNormalized.startsWith(searchPrefix) || searchNormalized.startsWith(foundNormalized.substring(0, Math.min(4, foundNormalized.length)))) {
        return table.analysis;
      }
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
  // Se context for 'global', usa 'home' como padrão (ou pode ser undefined)
  const analysisContext = context === 'global' ? undefined : context;
  return extractAnalysisFromTable(match[match.length - 1], actualTeamName, analysisContext);
}

// Função para extrair confronto direto (stat-cd3)
function extractH2HMatches(html: string): Match[] {
  const matches: Match[] = [];

  // Busca todas as tabelas de H2H (pode ter múltiplas classes)
  const h2hRegexes = [
    /<table[^>]*class="[^"]*stat-cd3[^"]*"[^>]*>([\s\S]*?)<\/table>/gi,
    /<table[^>]*class="[^"]*stat-h2h[^"]*"[^>]*>([\s\S]*?)<\/table>/gi,
    /CONFRONTO DIRETO[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/gi,
  ];

  for (const h2hRegex of h2hRegexes) {
    const tableMatches = html.matchAll(h2hRegex);
    
    for (const match of tableMatches) {
  const tableHtml = match[1];
  const rowRegex = /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = tableHtml.match(rowRegex) || [];

      for (const row of rows) {
        // Pula headers
        if (row.includes('<th') || row.includes('Data') && row.includes('Casa') && row.includes('Fora')) {
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

        if (cells.length >= 4) {
          // Formato pode variar: [Data, Casa, Placar, Fora] ou [Data, Competição, Casa, Placar, Fora]
          let date = cells[0] || '';
          let competition = '';
          let homeTeam = '';
          let score = '';
          let awayTeam = '';

    if (cells.length >= 5) {
            // Formato: Data, Competição, Casa, Placar, Fora
            date = cells[0];
            competition = cells[1];
            homeTeam = cells[2];
            score = cells[3];
            awayTeam = cells[4];
          } else {
            // Formato: Data, Casa, Placar, Fora
            date = cells[0];
            homeTeam = cells[1];
            score = cells[2];
            awayTeam = cells[3];
          }

          // Extrai placar (pode ser "1-1", "0-2", "1:1", etc)
          const scoreMatch = score.match(/(\d+)[-:](\d+)/);
          if (scoreMatch && homeTeam && awayTeam) {
            const homeScore = parseInt(scoreMatch[1]) || 0;
            const awayScore = parseInt(scoreMatch[2]) || 0;

            // Evita duplicatas
            const isDuplicate = matches.some(m => 
              m.date === date && 
              m.homeTeam === homeTeam && 
              m.awayTeam === awayTeam
            );

            if (!isDuplicate) {
      matches.push({
        date,
                competition: competition || 'Brasileirão Série A',
                homeTeam: homeTeam.trim(),
                awayTeam: awayTeam.trim(),
        homeScore,
        awayScore
      });
            }
          }
        }
      }
    }
  }

  // Ordena por data (mais recente primeiro)
  matches.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return matches;
}

// Função para extrair tabela de classificação
function extractStandings(html: string, competitionName?: string): Standing[] {
  const standings: Standing[] = [];

  // Primeiro, tenta encontrar a seção de classificação relacionada à competição
  // Busca por "Fase de Grupos", "Classificação", ou títulos relacionados à competição
  let searchSection = html;
  
  if (competitionName) {
    // Tenta encontrar seção específica da competição
    const competitionSectionRegex = new RegExp(
      `(?:Fase de Grupos|Classificação|Grupo)[\\s\\S]*?${competitionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?:Fase de Grupos|Classificação|Grupo|Confronto|GOLS)`,
      'i'
    );
    const competitionMatch = html.match(competitionSectionRegex);
    if (competitionMatch) {
      searchSection = competitionMatch[0];
      console.log(`[extractStandings] Encontrada seção específica da competição: ${competitionName}`);
    }
  }

  // Busca por "Fase de Grupos" que geralmente contém a classificação
  const groupPhaseRegex = /Fase de Grupos[\s\S]*?Grupo [A-Z][\s\S]*?(?:Confronto|GOLS|Análise)/i;
  const groupPhaseMatch = searchSection.match(groupPhaseRegex);
  if (groupPhaseMatch) {
    searchSection = groupPhaseMatch[0];
    console.log('[extractStandings] Encontrada seção "Fase de Grupos"');
  }

  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(searchSection)) !== null) {
    const tableHtml = tableMatch[0];
    const headerHtml = tableHtml.match(/<thead[\s\S]*?<\/thead>/i)?.[0] || '';
    const headerText = normalizeLabelText(headerHtml);

    // Verifica se é uma tabela de classificação
    const hasStandingsHeaders = headerText.includes('pontos') || 
                                 headerText.includes('pts') || 
                                 headerText.includes('#') || 
                                 headerText.includes('pos') ||
                                 headerText.includes('time') && headerText.includes('jogos');

    if (!hasStandingsHeaders) {
      continue;
    }

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;
    const tempStandings: Standing[] = [];

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[0];
      if (rowHtml.includes('<th')) {
        continue;
      }

      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      const cells: string[] = [];
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        cells.push(cleanHTMLText(cellMatch[1]));
      }

      if (cells.length < 3) {
        continue;
      }

      const position = parseInt(cells[0].replace(/[^0-9]/g, ''), 10);
      const team = cells[1];
      const points = parseInt((cells[2] || '').replace(/[^0-9]/g, ''), 10);
      const played = parseInt((cells[3] || '').replace(/[^0-9]/g, ''), 10);
      const wins = parseInt((cells[4] || '').replace(/[^0-9]/g, ''), 10);
      const draws = parseInt((cells[5] || '').replace(/[^0-9]/g, ''), 10);
      const losses = parseInt((cells[6] || '').replace(/[^0-9]/g, ''), 10);

      if (!team || !position) {
        continue;
      }

      if (tempStandings.some(item => item.team === team && item.position === position)) {
        continue;
      }

      tempStandings.push({
        position,
        team,
        points: Number.isNaN(points) ? 0 : points,
        played: Number.isNaN(played) ? 0 : played,
        wins: Number.isNaN(wins) ? 0 : wins,
        draws: Number.isNaN(draws) ? 0 : draws,
        losses: Number.isNaN(losses) ? 0 : losses
      });
    }

    if (tempStandings.length > 0) {
      console.log(`[extractStandings] Encontrada tabela com ${tempStandings.length} times`);
      return tempStandings;
    }
  }

  return standings;
}

// Função ALTERNATIVA: Busca goal stats diretamente no HTML usando padrões de texto
function extractGoalStatsDirectly(html: string, teamName: string, scope: 'home' | 'away' | 'global'): TeamGoalStats {
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

  console.log(`[extractGoalStatsDirectly] Buscando diretamente no HTML para ${teamName} (${scope})`);
  
  const actualTeamName = findTeamNameInHTML(html, teamName) || teamName;
  const escapedName = actualTeamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Busca seção próxima ao nome do time
  const teamSectionRegex = new RegExp(`${escapedName}[\\s\\S]{0,2000}(?:Média de gols|> 2,5|< 2,5|Jogos sem)`, 'i');
  const teamSection = html.match(teamSectionRegex);
  
  if (!teamSection) {
    console.log(`[extractGoalStatsDirectly] Seção do time não encontrada`);
    return defaultStats;
  }
  
  const searchSection = teamSection[0];
  
  // Padrões para buscar valores diretamente no texto
  const patterns = {
    avgGoalsScored: [
      new RegExp(`média[\\s]*de[\\s]*gols[\\s]*marcados[^<]*?${escapedName}[^<]*?([\\d,]+)`, 'i'),
      new RegExp(`${escapedName}[^<]*?média[\\s]*de[\\s]*gols[\\s]*marcados[^<]*?([\\d,]+)`, 'i'),
      /média[\\s]*de[\\s]*gols[\\s]*marcados[^<]*?casa[^<]*?([\d,]+)/i,
      /média[\\s]*de[\\s]*gols[\\s]*marcados[^<]*?fora[^<]*?([\d,]+)/i,
    ],
    avgGoalsConceded: [
      new RegExp(`média[\\s]*de[\\s]*gols[\\s]*sofridos[^<]*?${escapedName}[^<]*?([\\d,]+)`, 'i'),
      new RegExp(`${escapedName}[^<]*?média[\\s]*de[\\s]*gols[\\s]*sofridos[^<]*?([\\d,]+)`, 'i'),
      /média[\\s]*de[\\s]*gols[\\s]*sofridos[^<]*?casa[^<]*?([\d,]+)/i,
      /média[\\s]*de[\\s]*gols[\\s]*sofridos[^<]*?fora[^<]*?([\d,]+)/i,
    ],
    over25Pct: [
      /mais[\\s]*de[\\s]*2[\\s]*,?[\\s]*5[^<]*?([\d]+)[\\s]*%/i,
      />[\\s]*2[\\s]*,?[\\s]*5[^<]*?([\d]+)[\\s]*%/i,
      /over[\\s]*2[\\s]*\\.?[\\s]*5[^<]*?([\d]+)[\\s]*%/i,
    ],
    under25Pct: [
      /menos[\\s]*de[\\s]*2[\\s]*,?[\\s]*5[^<]*?([\d]+)[\\s]*%/i,
      /<[\\s]*2[\\s]*,?[\\s]*5[^<]*?([\d]+)[\\s]*%/i,
      /under[\\s]*2[\\s]*\\.?[\\s]*5[^<]*?([\d]+)[\\s]*%/i,
    ],
  };
  
  // Busca valores
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = searchSection.match(pattern);
      if (match && match[1]) {
        const value = parseNumericValue(match[1]);
        if (value > 0) {
          (defaultStats as any)[key] = value;
          console.log(`[extractGoalStatsDirectly] ✓ ${key}: ${value} (de "${match[1]}")`);
          break;
        }
      }
    }
  }
  
  return defaultStats;
}

// Função auxiliar para extrair goal stats de uma tabela HTML específica
function extractGoalStatsFromTable(tableHtml: string, scope: 'home' | 'away' | 'global'): TeamGoalStats {
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

  console.log(`[extractGoalStatsFromTable] Extraindo stats do escopo ${scope} de tabela com ${tableHtml.length} chars`);

  // Extrai linhas da tabela - múltiplos padrões
  const rowPatterns = [
    /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
    /<tr[^>]*>([\s\S]*?)<\/tr>/gi,
  ];
  
  let rows: string[] = [];
  for (const rowRegex of rowPatterns) {
    const matches = tableHtml.match(rowRegex);
    if (matches && matches.length > 0) {
      rows = matches;
      break;
    }
  }
  
  console.log(`[extractGoalStatsFromTable] Encontradas ${rows.length} linhas`);
  
  for (const row of rows) {
    // Pula cabeçalhos
    if (row.includes('<thead') || row.includes('</thead>') || row.includes('<th')) {
      continue;
    }
    
    // Extrai células da linha
    const cells: string[] = [];
    const cellPatterns = [
      /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi,
      /<td[^>]*>([\s\S]*?)<\/td>/gi,
    ];
    
    for (const cellRegex of cellPatterns) {
      let cellMatch;
      while ((cellMatch = cellRegex.exec(row)) !== null) {
        const cellText = cleanHTMLText(cellMatch[1]);
        if (cellText.trim()) {
          cells.push(cellText);
        }
      }
      if (cells.length > 0) break;
    }
    
    if (cells.length < 3) {
      continue;
    }
    
    // Primeira célula é o label
    const label = cells[0].toLowerCase().trim();
    
    // Determina qual coluna usar baseado no escopo
    let colIndex: number;
    if (cells.length >= 4) {
      colIndex = scope === 'home' ? 1 : scope === 'away' ? 2 : 3;
    } else if (cells.length === 3) {
      colIndex = scope === 'home' ? 1 : scope === 'away' ? 2 : 1;
    } else {
      continue;
    }
    
    const value = (cells[colIndex] || '').trim();
    
    // Extrai valores numéricos usando os parsers robustos
    if (label.includes('média de gols marcados') || label.includes('média gols marcados') || (label.includes('média') && label.includes('marcados'))) {
      const numValue = parseNumericValue(value);
      if (numValue > 0) {
        defaultStats.avgGoalsScored = numValue;
        console.log(`[extractGoalStatsFromTable] ✓ Média gols marcados (${scope}): ${numValue} (de "${value}")`);
      }
    } else if (label.includes('média de gols sofridos') || label.includes('média gols sofridos') || (label.includes('média') && label.includes('sofridos'))) {
      const numValue = parseNumericValue(value);
      if (numValue > 0) {
        defaultStats.avgGoalsConceded = numValue;
        console.log(`[extractGoalStatsFromTable] ✓ Média gols sofridos (${scope}): ${numValue} (de "${value}")`);
      }
    } else if (label.includes('média de gols marcados+sofridos') || label.includes('média total') || (label.includes('média') && label.includes('total'))) {
      const numValue = parseNumericValue(value);
      if (numValue > 0) {
        defaultStats.avgTotalGoals = numValue;
        console.log(`[extractGoalStatsFromTable] ✓ Média total gols (${scope}): ${numValue}`);
      }
    } else if (label.includes('mais de 2,5') || label.includes('> 2,5') || label.includes('mais de 2.5') || label.includes('>2.5')) {
      const numValue = parseIntegerValue(value);
      if (numValue > 0) {
        defaultStats.over25Pct = numValue;
        console.log(`[extractGoalStatsFromTable] ✓ > 2.5 gols (${scope}): ${numValue}%`);
      }
    } else if (label.includes('menos de 2,5') || label.includes('< 2,5') || label.includes('menos de 2.5') || label.includes('<2.5')) {
      const numValue = parseIntegerValue(value);
      if (numValue > 0) {
        defaultStats.under25Pct = numValue;
        console.log(`[extractGoalStatsFromTable] ✓ < 2.5 gols (${scope}): ${numValue}%`);
      }
    } else if (label.includes('sem marcar') || label.includes('s/ marcar') || label.includes('sem marcar gols') || (label.includes('sem') && label.includes('marcar'))) {
      const numValue = parseIntegerValue(value);
      if (numValue > 0) {
        defaultStats.noGoalsScoredPct = numValue;
        console.log(`[extractGoalStatsFromTable] ✓ Jogos sem marcar (${scope}): ${numValue}%`);
      }
    } else if (label.includes('sem sofrer') || label.includes('s/ sofrer') || label.includes('sem sofrer gols') || (label.includes('sem') && label.includes('sofrer'))) {
      const numValue = parseIntegerValue(value);
      if (numValue > 0) {
        defaultStats.noGoalsConcededPct = numValue;
        console.log(`[extractGoalStatsFromTable] ✓ Jogos sem sofrer (${scope}): ${numValue}%`);
      }
    }
  }
  
  // Calcula média total se não foi encontrada diretamente
  if (defaultStats.avgTotalGoals === 0 && defaultStats.avgGoalsScored > 0 && defaultStats.avgGoalsConceded > 0) {
    defaultStats.avgTotalGoals = defaultStats.avgGoalsScored + defaultStats.avgGoalsConceded;
    console.log(`[extractGoalStatsFromTable] Calculada média total: ${defaultStats.avgTotalGoals}`);
  }

  console.log(`[extractGoalStatsFromTable] RESULTADO (${scope}): Marcados=${defaultStats.avgGoalsScored}, Sofridos=${defaultStats.avgGoalsConceded}, Total=${defaultStats.avgTotalGoals}`);

  return defaultStats;
}

// Função para extrair estatísticas de gols de um time
function extractGoalStats(html: string, teamName: string, scope: 'home' | 'away' | 'global'): TeamGoalStats {
  const defaultStats: TeamGoalStats = {
    avgGoalsScored: 0,
    avgGoalsConceded: 0,
    avgTotalGoals: 0,
    noGoalsScoredPct: 0,
    noGoalsConcededPct: 0,
    over25Pct: 0,
    under25Pct: 0,
    goalMoments: {
      scored: [0, 0, 0, 0, 0, 0], // 0-15, 16-30, 31-45, 46-60, 61-75, 76-90
      conceded: [0, 0, 0, 0, 0, 0]
    }
  };

  const normalizedTeam = normalizeTeamName(teamName);
  
  console.log(`[extractGoalStats] ===== Buscando stats para ${teamName} (${scope}) =====`);
  console.log(`[extractGoalStats] Nome normalizado: "${normalizedTeam}"`);

  // PRIMEIRO: Encontra o nome exato do time no HTML (igual ao extractLast10Matches)
  const actualTeamName = findTeamNameInHTML(html, teamName);
  console.log(`[extractGoalStats] Nome encontrado no HTML: ${actualTeamName || 'NÃO ENCONTRADO'}`);
  
  const searchName = actualTeamName || teamName;
  const searchNormalized = normalizeTeamName(searchName);

  // ESTRATÉGIA 1: Busca na seção "ÚLTIMOS 10 JOGOS" ou "GOLS" ou "Análise de Gols"
  let sectionHtml = '';
  const sectionPatterns = [
    /(?:ÚLTIMOS 10 JOGOS|GOLS|Análise de Gols)[\s\S]*?(?:Confronto Direto|Classificação|Análise|$)/i,
    /GOLS[\s\S]*?(?:Confronto Direto|Classificação|Análise|$)/i,
    /Análise de Gols[\s\S]*?(?:Confronto Direto|Classificação|Análise|$)/i,
  ];
  
  for (const pattern of sectionPatterns) {
    const sectionMatch = html.match(pattern);
    if (sectionMatch) {
      sectionHtml = sectionMatch[0];
      console.log(`[extractGoalStats] Seção encontrada com padrão: ${pattern}`);
      break;
    }
  }
  
  if (!sectionHtml) {
    console.log(`[extractGoalStats] ⚠ Nenhuma seção GOLS/ÚLTIMOS 10 JOGOS encontrada. Tentando busca global...`);
    sectionHtml = html; // Se não encontrar seção, busca em todo o HTML
  }
  
  // Busca todas as tabelas stat-last10 OU stat-seqs com seus subtitles
  // Múltiplos padrões para capturar diferentes estruturas
  const tablePatterns = [
    /<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*(?:stat-last10|stat-seqs)[^"]*"[^>]*>([\s\S]*?)<\/table>/gi,
    /<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/gi,
  ];
  
  const goalStatsTables: Array<{ teamName: string; tableHtml: string; index: number }> = [];
  let tableIndex = 0;
  
  for (const tableRegex of tablePatterns) {
    let match;
    while ((match = tableRegex.exec(sectionHtml)) !== null) {
      const foundTeamName = match[1].trim();
      const tableHtml = match[2];
      
      // Verifica se é uma tabela de estatísticas de gols
      const isGoalStatsTable = 
        tableHtml.includes('Média de gols') || 
        tableHtml.includes('> 2,5') || 
        tableHtml.includes('< 2,5') || 
        tableHtml.includes('Jogos sem') ||
        tableHtml.includes('Média de gols marcados') ||
        tableHtml.includes('Média de gols sofridos') ||
        tableHtml.includes('média') && (tableHtml.includes('gols') || tableHtml.includes('gol'));
      
      if (isGoalStatsTable) {
        // Verifica se já não existe (evita duplicatas)
        const exists = goalStatsTables.some(t => t.teamName === foundTeamName && t.tableHtml === tableHtml);
        if (!exists) {
          goalStatsTables.push({ teamName: foundTeamName, tableHtml, index: tableIndex++ });
          console.log(`[extractGoalStats] Tabela ${tableIndex} de goal stats encontrada para: "${foundTeamName}"`);
        }
      }
    }
  }
  
  console.log(`[extractGoalStats] Total de ${goalStatsTables.length} tabelas encontradas. Buscando para: "${teamName}" (normalizado: "${normalizedTeam}", encontrado no HTML: "${searchName}")`);
  
  // Lista todas as tabelas encontradas para debug
  goalStatsTables.forEach((t, idx) => {
    const foundNormalized = normalizeTeamName(t.teamName);
    console.log(`[extractGoalStats]   Tabela ${idx + 1}: "${t.teamName}" (normalizado: "${foundNormalized}")`);
  });
  
  // ESTRATÉGIA 1: Busca exata usando o nome encontrado no HTML
  let foundTable = goalStatsTables.find(t => {
    const foundNormalized = normalizeTeamName(t.teamName);
    const isExactMatch = foundNormalized === searchNormalized;
    if (isExactMatch) {
      console.log(`[extractGoalStats] ✓✓✓ Match EXATO encontrado: "${t.teamName}" (normalizado: "${foundNormalized}") === "${searchNormalized}"`);
    }
    return isExactMatch;
  });
  
  // ESTRATÉGIA 2: Busca exata usando o nome original
  if (!foundTable) {
    foundTable = goalStatsTables.find(t => {
      const foundNormalized = normalizeTeamName(t.teamName);
      const isExactMatch = foundNormalized === normalizedTeam;
      if (isExactMatch) {
        console.log(`[extractGoalStats] ✓ Match EXATO (nome original) encontrado: "${t.teamName}" (normalizado: "${foundNormalized}") === "${normalizedTeam}"`);
      }
      return isExactMatch;
    });
  }
  
  // ESTRATÉGIA 3: Busca flexível - remove a restrição de tamanho mínimo
  if (!foundTable) {
    console.log(`[extractGoalStats] Buscando match flexível para "${searchNormalized}"...`);
    for (const t of goalStatsTables) {
      const foundNormalized = normalizeTeamName(t.teamName);
      const foundCleaned = foundNormalized.replace(/[^a-z0-9]/g, '');
      const searchCleaned = searchNormalized.replace(/[^a-z0-9]/g, '');
      
      // Match flexível: um contém o outro E tem pelo menos 3 caracteres em comum
      const hasMatch = (foundCleaned.includes(searchCleaned) || searchCleaned.includes(foundCleaned)) &&
                      foundCleaned.length >= 3 && searchCleaned.length >= 3;
      
      if (hasMatch) {
        console.log(`[extractGoalStats] ✓ Match FLEXÍVEL encontrado: "${t.teamName}" (normalizado: "${foundNormalized}") ~= "${searchNormalized}"`);
        foundTable = t;
        break;
      }
    }
  }
  
  // ESTRATÉGIA 4: Se ainda não encontrou e há apenas 2 tabelas, usa a primeira para teamA e segunda para teamB
  if (!foundTable && goalStatsTables.length === 2) {
    // Esta é uma estratégia de fallback - assume que a primeira tabela é do primeiro time mencionado
    console.log(`[extractGoalStats] ⚠ Usando estratégia de fallback: ${goalStatsTables.length} tabelas encontradas`);
    // Não vamos usar isso automaticamente, mas vamos logar
  }
  
  let tableHtml = '';
  
  if (foundTable) {
    tableHtml = foundTable.tableHtml;
    console.log(`[extractGoalStats] ✓✓✓ Tabela encontrada para ${teamName} (encontrado: "${foundTable.teamName}")`);
    console.log(`[extractGoalStats] Tamanho da tabela: ${tableHtml.length} chars`);
  } else {
    console.log(`[extractGoalStats] ⚠ Nenhuma tabela encontrada para ${teamName}. Tabelas disponíveis: ${goalStatsTables.map(t => `"${t.teamName}"`).join(', ')}`);
    console.log(`[extractGoalStats] Nome normalizado buscado: "${normalizedTeam}"`);
  }
  
  if (tableHtml) {
    // Extrai linhas da tabela - múltiplos padrões
    const rowPatterns = [
      /<tr[^>]*class="[^"]*(even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
      /<tr[^>]*>([\s\S]*?)<\/tr>/gi,
    ];
    
    let rows: string[] = [];
    for (const rowRegex of rowPatterns) {
      const matches = tableHtml.match(rowRegex);
      if (matches && matches.length > 0) {
        rows = matches;
        console.log(`[extractGoalStats] Encontradas ${rows.length} linhas na tabela usando padrão: ${rowRegex}`);
        break;
      }
    }
    
    if (rows.length === 0) {
      console.log(`[extractGoalStats] ⚠ Nenhuma linha encontrada na tabela`);
    }
    
    for (const row of rows) {
      // Pula cabeçalhos
      if (row.includes('<thead') || row.includes('</thead>') || row.includes('<th')) {
        continue;
      }
      
      // Extrai células da linha - múltiplos padrões
      const cells: string[] = [];
      const cellPatterns = [
        /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi,
        /<td[^>]*>([\s\S]*?)<\/td>/gi,
      ];
      
      for (const cellRegex of cellPatterns) {
        let cellMatch;
        while ((cellMatch = cellRegex.exec(row)) !== null) {
          const cellText = cleanHTMLText(cellMatch[1]);
          if (cellText.trim()) {
            cells.push(cellText);
          }
        }
        if (cells.length > 0) break;
      }
      
      if (cells.length < 3) {
        console.log(`[extractGoalStats] Linha ignorada: apenas ${cells.length} células (esperado: 3+). Células: [${cells.map((c, i) => `${i}:"${c.substring(0, 30)}"`).join(', ')}]`);
        continue;
      }
      
      // Primeira célula é o label
      const label = cells[0].toLowerCase().trim();
      
      // Determina qual coluna usar baseado no escopo
      // Formato pode ser: [Label, Casa, Fora, Global] ou [Label, Casa, Fora]
      let colIndex: number;
      if (cells.length >= 4) {
        // Formato completo: Label, Casa, Fora, Global
        colIndex = scope === 'home' ? 1 : scope === 'away' ? 2 : 3;
      } else if (cells.length === 3) {
        // Formato: Label, Casa, Fora (sem Global)
        colIndex = scope === 'home' ? 1 : scope === 'away' ? 2 : 1; // Se global, usa casa como fallback
      } else {
        continue;
      }
      
      const value = (cells[colIndex] || '').trim();
      
      // Debug detalhado
      console.log(`[extractGoalStats] Processando linha: "${label.substring(0, 50)}" | Coluna ${colIndex} (${scope}): "${value}" | Total células: ${cells.length}`);
      
      // Extrai valores numéricos
      if (label.includes('média de gols marcados') || label.includes('média gols marcados') || (label.includes('média') && label.includes('marcados'))) {
        const numValue = parseNumericValue(value);
        if (numValue > 0) {
          defaultStats.avgGoalsScored = numValue;
          console.log(`[extractGoalStats] ✓✓✓ Média gols marcados (${scope}): ${numValue} (da célula ${colIndex}: "${value}")`);
        } else {
          console.log(`[extractGoalStats] ⚠ Valor inválido para média gols marcados: "${value}" (parseado: ${numValue})`);
        }
      } else if (label.includes('média de gols sofridos') || label.includes('média gols sofridos') || (label.includes('média') && label.includes('sofridos'))) {
        const numValue = parseNumericValue(value);
        if (numValue > 0) {
          defaultStats.avgGoalsConceded = numValue;
          console.log(`[extractGoalStats] ✓✓✓ Média gols sofridos (${scope}): ${numValue} (da célula ${colIndex}: "${value}")`);
        } else {
          console.log(`[extractGoalStats] ⚠ Valor inválido para média gols sofridos: "${value}" (parseado: ${numValue})`);
        }
      } else if (label.includes('média de gols marcados+sofridos') || label.includes('média total') || (label.includes('média') && label.includes('total'))) {
        const numValue = parseNumericValue(value);
        if (numValue > 0) {
          defaultStats.avgTotalGoals = numValue;
          console.log(`[extractGoalStats] ✓ Média total gols (${scope}): ${numValue}`);
        }
      } else if (label.includes('mais de 2,5') || label.includes('> 2,5') || label.includes('mais de 2.5') || label.includes('>2.5')) {
        const numValue = parseIntegerValue(value);
        if (numValue > 0) {
          defaultStats.over25Pct = numValue;
          console.log(`[extractGoalStats] ✓ > 2.5 gols (${scope}): ${numValue}%`);
        }
      } else if (label.includes('menos de 2,5') || label.includes('< 2,5') || label.includes('menos de 2.5') || label.includes('<2.5')) {
        const numValue = parseIntegerValue(value);
        if (numValue > 0) {
          defaultStats.under25Pct = numValue;
          console.log(`[extractGoalStats] ✓ < 2.5 gols (${scope}): ${numValue}%`);
        }
      } else if (label.includes('sem marcar') || label.includes('s/ marcar') || label.includes('sem marcar gols') || (label.includes('sem') && label.includes('marcar'))) {
        const numValue = parseIntegerValue(value);
        if (numValue > 0) {
          defaultStats.noGoalsScoredPct = numValue;
          console.log(`[extractGoalStats] ✓ Jogos sem marcar (${scope}): ${numValue}%`);
        }
      } else if (label.includes('sem sofrer') || label.includes('s/ sofrer') || label.includes('sem sofrer gols') || (label.includes('sem') && label.includes('sofrer'))) {
        const numValue = parseIntegerValue(value);
        if (numValue > 0) {
          defaultStats.noGoalsConcededPct = numValue;
          console.log(`[extractGoalStats] ✓ Jogos sem sofrer (${scope}): ${numValue}%`);
        }
      }
    }
  } else {
    console.log(`[extractGoalStats] ⚠ Nenhuma tabela encontrada para ${teamName}`);
  }
  
  // Calcula média total se não foi encontrada diretamente
  if (defaultStats.avgTotalGoals === 0 && defaultStats.avgGoalsScored > 0 && defaultStats.avgGoalsConceded > 0) {
    defaultStats.avgTotalGoals = defaultStats.avgGoalsScored + defaultStats.avgGoalsConceded;
    console.log(`[extractGoalStats] Calculada média total: ${defaultStats.avgTotalGoals}`);
  }

  console.log(`[extractGoalStats] ===== RESULTADO FINAL ${teamName} (${scope}) =====`);
  console.log(`[extractGoalStats] Marcados=${defaultStats.avgGoalsScored}, Sofridos=${defaultStats.avgGoalsConceded}, Total=${defaultStats.avgTotalGoals}`);
  console.log(`[extractGoalStats] >2.5=${defaultStats.over25Pct}%, <2.5=${defaultStats.under25Pct}%, Sem marcar=${defaultStats.noGoalsScoredPct}%, Sem sofrer=${defaultStats.noGoalsConcededPct}%`);

  return defaultStats;
}

// Função para extrair informações básicas do jogo
function extractMatchInfo(html: string): { teamA: string; teamB: string; date: string; competition: string } | null {
  // Estratégia 1: Procura por JSON-LD
  const jsonScriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs;
  const scripts = html.match(jsonScriptRegex);
  
  if (scripts) {
    for (const script of scripts) {
      try {
        const jsonMatch = script.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data['@type'] === 'SportsEvent') {
            const teamA = data.homeTeam?.name || '';
            const teamB = data.awayTeam?.name || '';
            if (teamA && teamB) {
            return {
                teamA,
                teamB,
              date: data.startDate || '',
              competition: data.location?.name?.split(' - ')[1] || data.location?.name || ''
            };
            }
          }
          // Também verifica @graph
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            for (const item of data['@graph']) {
              if (item['@type'] === 'SportsEvent') {
                const teamA = item.homeTeam?.name || '';
                const teamB = item.awayTeam?.name || '';
                if (teamA && teamB) {
                  return {
                    teamA,
                    teamB,
                    date: item.startDate || '',
                    competition: item.location?.name?.split(' - ')[1] || item.location?.name || ''
                  };
                }
              }
            }
          }
        }
      } catch (e) {
        // Continua procurando
      }
    }
  }

  // Estratégia 2: Procura por títulos ou headings com nomes dos times
  // Padrão comum: "França vs Ucrânia" ou "França - Ucrânia"
  const titlePatterns = [
    /<h[1-3][^>]*>([^<]+)\s+(?:vs|VS|v|V|vs\.|VS\.|-)\s+([^<]+)<\/h[1-3]>/i,
    /<title[^>]*>([^<]+)\s+(?:vs|VS|v|V|vs\.|VS\.|-)\s+([^<]+)<\/title>/i,
    /class="[^"]*match-title[^"]*"[^>]*>([^<]+)\s+(?:vs|VS|v|V|vs\.|VS\.|-)\s+([^<]+)</i,
  ];

  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[2]) {
      return {
        teamA: match[1].trim(),
        teamB: match[2].trim(),
        date: '',
        competition: ''
      };
    }
  }

  // Estratégia 3: Procura por tabelas de form e extrai nomes dos times de lá
  const formTableRegex = /<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>/gi;
  const teamNames: string[] = [];
  let formMatch;
  while ((formMatch = formTableRegex.exec(html)) !== null && teamNames.length < 2) {
    const teamName = formMatch[1].trim();
    if (teamName && !teamNames.includes(teamName)) {
      teamNames.push(teamName);
    }
  }

  if (teamNames.length >= 2) {
    return {
      teamA: teamNames[0],
      teamB: teamNames[1],
      date: '',
      competition: ''
    };
  }

  // Estratégia 4: Procura na URL (último recurso)
  // Exemplo: /franca/ucrania/ -> França vs Ucrânia
  const urlMatch = html.match(/\/stats\/match\/[^\/]+\/[^\/]+\/([^\/]+)\/([^\/]+)\//);
  if (urlMatch && urlMatch[1] && urlMatch[2]) {
    // Converte slug para nome (capitaliza primeira letra)
    const teamA = urlMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const teamB = urlMatch[2].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      teamA,
      teamB,
      date: '',
      competition: ''
    };
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
      if (!matchInfo || !matchInfo.teamA || !matchInfo.teamB) {
        // Tenta usar os nomes do matchId se disponível
        const matchIdParts = (matchId || '').split('-');
        if (matchIdParts.length >= 2) {
          const fallbackTeamA = matchIdParts[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const fallbackTeamB = matchIdParts.slice(1).join('-').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
      if (!matchInfo) {
        return res.status(400).json({ 
              error: 'Não foi possível extrair informações básicas do jogo do HTML',
              suggestion: `Tentando usar: ${fallbackTeamA} vs ${fallbackTeamB}`,
              debug: {
                htmlLength: html.length,
                hasJsonLd: html.includes('application/ld+json'),
                hasSportsEvent: html.includes('SportsEvent'),
                sample: html.substring(0, 500)
              }
            });
          }
          
          // Se matchInfo existe mas está incompleto, completa com fallback
          if (!matchInfo.teamA) matchInfo.teamA = fallbackTeamA;
          if (!matchInfo.teamB) matchInfo.teamB = fallbackTeamB;
        } else {
          return res.status(400).json({ 
            error: 'Não foi possível extrair informações básicas do jogo do HTML',
            debug: {
              htmlLength: html.length,
              hasJsonLd: html.includes('application/ld+json'),
              hasSportsEvent: html.includes('SportsEvent'),
              matchId: matchId,
              sample: html.substring(0, 500)
            }
          });
        }
      }

      console.log('Match Info extraído:', matchInfo);
      console.log('Procurando dados para:', matchInfo.teamA, 'vs', matchInfo.teamB);
      console.log('Competição:', matchInfo.competition);
      console.log('URL do jogo processada (matchId):', matchId);

      // NOVA ABORDAGEM: Extrai todas as informações diretamente do HTML pela estrutura
      // Identifica qual tabela pertence a qual time pelo nome encontrado no HTML
      
      // 1. Extrai todas as tabelas de "Últimos 10 jogos" (Form) e identifica qual é de qual time
      console.log('=== Extraindo Form ===');
      const allFormTables = extractAllFormTablesWithNames(html);
      console.log(`Tabelas de form encontradas: ${allFormTables.length}`);
      allFormTables.forEach((t, i) => console.log(`  ${i + 1}. ${t.teamName}: ${t.matches.length} jogos`));
      
      const teamAForm = findTableForTeam(allFormTables, matchInfo.teamA) || [];
      const teamBForm = findTableForTeam(allFormTables, matchInfo.teamB) || [];
      console.log(`Form final: Time A (${matchInfo.teamA}) = ${teamAForm.length}, Time B (${matchInfo.teamB}) = ${teamBForm.length}`);
      
      // 2. Extrai todas as tabelas de streaks e identifica qual é de qual time
      console.log('=== Extraindo Streaks ===');
      const allStreaksTables = extractAllStreaksTablesWithNames(html);
      console.log(`Tabelas de streaks encontradas: ${allStreaksTables.length}`);
      allStreaksTables.forEach((t, i) => console.log(`  ${i + 1}. ${t.teamName}`));
      
      const teamAStreaks = findStreaksForTeam(allStreaksTables, matchInfo.teamA) || { home: defaultStreaks(), away: defaultStreaks(), global: defaultStreaks() };
      const teamBStreaks = findStreaksForTeam(allStreaksTables, matchInfo.teamB) || { home: defaultStreaks(), away: defaultStreaks(), global: defaultStreaks() };
      console.log(`Streaks final: Time A =`, teamAStreaks);
      console.log(`Streaks final: Time B =`, teamBStreaks);
      
      // 3. Extrai todas as tabelas de análise classificativa e identifica qual é de qual time
      console.log('=== Extraindo Análise ===');
      const allAnalysisTables = extractAllAnalysisTablesWithNames(html);
      console.log(`Tabelas de análise encontradas: ${allAnalysisTables.length}`);
      allAnalysisTables.forEach((t, i) => console.log(`  ${i + 1}. ${t.teamName}: home=${t.analysis.home.length}, away=${t.analysis.away.length}, global=${t.analysis.global.length}`));
      
      const teamAOpponentAnalysis = findAnalysisForTeam(allAnalysisTables, matchInfo.teamA) || { home: [], away: [], global: [] };
      const teamBOpponentAnalysis = findAnalysisForTeam(allAnalysisTables, matchInfo.teamB) || { home: [], away: [], global: [] };
      console.log(`Análise final: Time A =`, {
        home: teamAOpponentAnalysis.home.length,
        away: teamAOpponentAnalysis.away.length,
        global: teamAOpponentAnalysis.global.length
      });
      console.log(`Análise final: Time B =`, {
        home: teamBOpponentAnalysis.home.length,
        away: teamBOpponentAnalysis.away.length,
        global: teamBOpponentAnalysis.global.length
      });
      
      // 4. Extrai H2H (apenas jogos entre os dois times do jogo atual)
      console.log('=== Extraindo H2H ===');
      const allH2HMatches = extractH2HMatches(html);
      // Filtra apenas jogos entre os dois times do jogo atual
      const h2hData = allH2HMatches.filter(match => {
        const homeNormalized = normalizeTeamName(match.homeTeam);
        const awayNormalized = normalizeTeamName(match.awayTeam);
        const teamANormalized = normalizeTeamName(matchInfo.teamA);
        const teamBNormalized = normalizeTeamName(matchInfo.teamB);
        
        return (homeNormalized === teamANormalized && awayNormalized === teamBNormalized) ||
               (homeNormalized === teamBNormalized && awayNormalized === teamANormalized) ||
               homeNormalized.includes(teamANormalized) && awayNormalized.includes(teamBNormalized) ||
               homeNormalized.includes(teamBNormalized) && awayNormalized.includes(teamANormalized);
      });
      console.log(`H2H: ${h2hData.length} jogos entre ${matchInfo.teamA} e ${matchInfo.teamB} (de ${allH2HMatches.length} total)`);

      // 5. Extrai classificação (da competição do jogo atual)
      console.log('=== Extraindo Classificação ===');
      console.log(`Buscando classificação para competição: "${matchInfo.competition}"`);
      // Passa a competição para ajudar a identificar a tabela correta
      const allStandings = extractStandings(html, matchInfo.competition);
      console.log(`Total de times encontrados na busca inicial: ${allStandings.length}`);
      
      // Filtra apenas times que fazem parte da competição do jogo
      const standingsData = allStandings.filter(standing => {
        // Verifica se o time está relacionado aos times do jogo
        const teamNormalized = normalizeTeamName(standing.team);
        const teamANormalized = normalizeTeamName(matchInfo.teamA);
        const teamBNormalized = normalizeTeamName(matchInfo.teamB);
        
        const isRelated = teamNormalized === teamANormalized || 
               teamNormalized === teamBNormalized ||
               teamNormalized.includes(teamANormalized) ||
               teamNormalized.includes(teamBNormalized);
        
        if (isRelated) {
          console.log(`  ✓ Time relacionado encontrado: ${standing.team} (posição ${standing.position})`);
        }
        
        return isRelated;
      });
      
      // Se não encontrou nenhum time do jogo, mas encontrou poucos times, assume que é a competição correta
      // Mas só se a competição não for "Brasileirão Série A" (que é o padrão)
      const isDefaultCompetition = matchInfo.competition === 'Brasileirão Série A' || !matchInfo.competition;
      const finalStandings = standingsData.length > 0 
        ? standingsData 
        : (allStandings.length > 0 && allStandings.length <= 20 && !isDefaultCompetition ? allStandings : []);
      
      console.log(`Classificação FINAL: ${finalStandings.length} times encontrados (de ${allStandings.length} total) para competição: "${matchInfo.competition}"`);
      if (finalStandings.length > 0) {
        console.log(`  Primeiros times: ${finalStandings.slice(0, 3).map(s => `${s.position}. ${s.team}`).join(', ')}`);
      }

      // 6. Extrai estatísticas de gols (dos times específicos do jogo)
      console.log('=== Extraindo Estatísticas de Gols ===');
      console.log(`Extraindo goal stats para ${matchInfo.teamA} e ${matchInfo.teamB}`);
      
      // NOVA ABORDAGEM: Busca todas as tabelas uma vez e distribui entre os times
      // Isso garante que cada time pegue sua própria tabela
      const teamANormalized = normalizeTeamName(matchInfo.teamA);
      const teamBNormalized = normalizeTeamName(matchInfo.teamB);
      const teamAActualName = findTeamNameInHTML(html, matchInfo.teamA) || matchInfo.teamA;
      const teamBActualName = findTeamNameInHTML(html, matchInfo.teamB) || matchInfo.teamB;
      const teamAActualNormalized = normalizeTeamName(teamAActualName);
      const teamBActualNormalized = normalizeTeamName(teamBActualName);
      
      console.log(`[Goal Stats] Time A: "${matchInfo.teamA}" -> "${teamAActualName}" (normalizado: "${teamAActualNormalized}")`);
      console.log(`[Goal Stats] Time B: "${matchInfo.teamB}" -> "${teamBActualName}" (normalizado: "${teamBActualNormalized}")`);
      
      // Busca todas as tabelas de goal stats
      let sectionHtml = '';
      const sectionPatterns = [
        /(?:ÚLTIMOS 10 JOGOS|GOLS|Análise de Gols)[\s\S]*?(?:Confronto Direto|Classificação|Análise|$)/i,
        /GOLS[\s\S]*?(?:Confronto Direto|Classificação|Análise|$)/i,
        /Análise de Gols[\s\S]*?(?:Confronto Direto|Classificação|Análise|$)/i,
      ];
      
      for (const pattern of sectionPatterns) {
        const sectionMatch = html.match(pattern);
        if (sectionMatch) {
          sectionHtml = sectionMatch[0];
          break;
        }
      }
      
      if (!sectionHtml) {
        sectionHtml = html;
      }
      
      // Busca todas as tabelas - MÚLTIPLAS ESTRATÉGIAS
      const allGoalStatsTables: Array<{ teamName: string; tableHtml: string; index: number }> = [];
      let tableIndex = 0;
      
      // ESTRATÉGIA 1: Busca com stats-subtitle (padrão)
      const tablePatterns = [
        /<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*class="[^"]*(?:stat-last10|stat-seqs)[^"]*"[^>]*>([\s\S]*?)<\/table>/gi,
        /<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/gi,
      ];
      
      for (const tableRegex of tablePatterns) {
        let match;
        while ((match = tableRegex.exec(sectionHtml)) !== null) {
          const foundTeamName = match[1].trim();
          const tableHtml = match[2];
          
          const isGoalStatsTable = 
            tableHtml.includes('Média de gols') || 
            tableHtml.includes('> 2,5') || 
            tableHtml.includes('< 2,5') || 
            tableHtml.includes('Jogos sem') ||
            tableHtml.includes('Média de gols marcados') ||
            tableHtml.includes('Média de gols sofridos') ||
            (tableHtml.includes('média') && (tableHtml.includes('gols') || tableHtml.includes('gol')));
          
          if (isGoalStatsTable) {
            const exists = allGoalStatsTables.some(t => t.teamName === foundTeamName && t.tableHtml === tableHtml);
            if (!exists) {
              allGoalStatsTables.push({ teamName: foundTeamName, tableHtml, index: tableIndex++ });
              console.log(`[Goal Stats] ESTRATÉGIA 1: Tabela ${tableIndex} encontrada: "${foundTeamName}"`);
            }
          }
        }
      }
      
      // ESTRATÉGIA 2: Busca TODAS as tabelas stat-last10 ou stat-seqs e verifica se são goal stats
      if (allGoalStatsTables.length < 2) {
        console.log(`[Goal Stats] ESTRATÉGIA 2: Buscando tabelas sem stats-subtitle (encontradas: ${allGoalStatsTables.length})`);
        const allTablesRegex = /<table[^>]*class="[^"]*(?:stat-last10|stat-seqs)[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
        let tableMatch;
        let foundCount = 0;
        
        while ((tableMatch = allTablesRegex.exec(sectionHtml)) !== null) {
          const tableHtml = tableMatch[1];
          
          const isGoalStatsTable = 
            tableHtml.includes('Média de gols') || 
            tableHtml.includes('> 2,5') || 
            tableHtml.includes('< 2,5') || 
            tableHtml.includes('Jogos sem') ||
            tableHtml.includes('Média de gols marcados') ||
            tableHtml.includes('Média de gols sofridos') ||
            (tableHtml.includes('média') && (tableHtml.includes('gols') || tableHtml.includes('gol')));
          
          if (isGoalStatsTable) {
            foundCount++;
            // Tenta encontrar o nome do time ANTES da tabela (busca reversa)
            const beforeTable = sectionHtml.substring(0, tableMatch.index);
            const teamNameMatch = beforeTable.match(/<span[^>]*class="[^"]*stats-subtitle[^"]*"[^>]*>([^<]+)<\/span>/i);
            const foundTeamName = teamNameMatch ? teamNameMatch[1].trim() : `Time ${foundCount}`;
            
            const exists = allGoalStatsTables.some(t => t.tableHtml === tableHtml);
            if (!exists) {
              allGoalStatsTables.push({ teamName: foundTeamName, tableHtml, index: tableIndex++ });
              console.log(`[Goal Stats] ESTRATÉGIA 2: Tabela ${tableIndex} encontrada: "${foundTeamName}"`);
            }
          }
        }
      }
      
      // ESTRATÉGIA 3: Se ainda não encontrou 2 tabelas, busca por contexto (próximo ao nome do time)
      if (allGoalStatsTables.length < 2) {
        console.log(`[Goal Stats] ESTRATÉGIA 3: Buscando por contexto dos times (encontradas: ${allGoalStatsTables.length})`);
        
        // Busca tabelas próximas aos nomes dos times
        for (const teamName of [teamAActualName, teamBActualName]) {
          const escapedName = teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const contextRegex = new RegExp(`${escapedName}[\\s\\S]{0,500}<table[^>]*>([\\s\\S]*?)<\\/table>`, 'i');
          const contextMatch = sectionHtml.match(contextRegex);
          
          if (contextMatch) {
            const tableHtml = contextMatch[1];
            const isGoalStatsTable = 
              tableHtml.includes('Média de gols') || 
              tableHtml.includes('> 2,5') || 
              tableHtml.includes('< 2,5') ||
              (tableHtml.includes('média') && (tableHtml.includes('gols') || tableHtml.includes('gol')));
            
            if (isGoalStatsTable) {
              const exists = allGoalStatsTables.some(t => t.teamName === teamName && t.tableHtml === tableHtml);
              if (!exists) {
                allGoalStatsTables.push({ teamName, tableHtml, index: tableIndex++ });
                console.log(`[Goal Stats] ESTRATÉGIA 3: Tabela ${tableIndex} encontrada para: "${teamName}"`);
              }
            }
          }
        }
      }
      
      console.log(`[Goal Stats] Total de ${allGoalStatsTables.length} tabelas encontradas`);
      allGoalStatsTables.forEach((t, idx) => {
        const foundNormalized = normalizeTeamName(t.teamName);
        console.log(`[Goal Stats]   Tabela ${idx + 1}: "${t.teamName}" (normalizado: "${foundNormalized}")`);
      });
      
      // Encontra tabela para Time A
      let teamATable = allGoalStatsTables.find(t => {
        const foundNormalized = normalizeTeamName(t.teamName);
        return foundNormalized === teamAActualNormalized || foundNormalized === teamANormalized;
      });
      
      // Se não encontrou exato, tenta flexível
      if (!teamATable) {
        for (const t of allGoalStatsTables) {
          const foundNormalized = normalizeTeamName(t.teamName);
          const foundCleaned = foundNormalized.replace(/[^a-z0-9]/g, '');
          const searchCleaned = teamAActualNormalized.replace(/[^a-z0-9]/g, '');
          if ((foundCleaned.includes(searchCleaned) || searchCleaned.includes(foundCleaned)) && foundCleaned.length >= 3 && searchCleaned.length >= 3) {
            teamATable = t;
            console.log(`[Goal Stats] Time A: Match flexível encontrado: "${t.teamName}"`);
            break;
          }
        }
      }
      
      // Se ainda não encontrou e há 2 tabelas, usa a primeira
      if (!teamATable && allGoalStatsTables.length >= 1) {
        teamATable = allGoalStatsTables[0];
        console.log(`[Goal Stats] Time A: Usando primeira tabela como fallback: "${teamATable.teamName}"`);
      }
      
      // Encontra tabela para Time B (garantindo que seja diferente da do Time A)
      let teamBTable = allGoalStatsTables.find(t => {
        if (teamATable && t === teamATable) return false; // Não pode ser a mesma tabela
        const foundNormalized = normalizeTeamName(t.teamName);
        return foundNormalized === teamBActualNormalized || foundNormalized === teamBNormalized;
      });
      
      // Se não encontrou exato, tenta flexível
      if (!teamBTable) {
        for (const t of allGoalStatsTables) {
          if (teamATable && t === teamATable) continue; // Pula a tabela do Time A
          const foundNormalized = normalizeTeamName(t.teamName);
          const foundCleaned = foundNormalized.replace(/[^a-z0-9]/g, '');
          const searchCleaned = teamBActualNormalized.replace(/[^a-z0-9]/g, '');
          if ((foundCleaned.includes(searchCleaned) || searchCleaned.includes(foundCleaned)) && foundCleaned.length >= 3 && searchCleaned.length >= 3) {
            teamBTable = t;
            console.log(`[Goal Stats] Time B: Match flexível encontrado: "${t.teamName}"`);
            break;
          }
        }
      }
      
      // Se ainda não encontrou e há 2 tabelas, usa a segunda
      if (!teamBTable && allGoalStatsTables.length >= 2) {
        teamBTable = allGoalStatsTables[1];
        console.log(`[Goal Stats] Time B: Usando segunda tabela como fallback: "${teamBTable.teamName}"`);
      }
      
      // Se ainda não encontrou, usa a primeira disponível que não seja do Time A
      if (!teamBTable && allGoalStatsTables.length >= 1) {
        teamBTable = allGoalStatsTables.find(t => t !== teamATable) || allGoalStatsTables[0];
        console.log(`[Goal Stats] Time B: Usando tabela disponível: "${teamBTable?.teamName}"`);
      }
      
      console.log(`[Goal Stats] Tabela Time A: ${teamATable ? `"${teamATable.teamName}" (${teamATable.tableHtml.length} chars)` : 'NÃO ENCONTRADA'}`);
      if (teamATable) {
        const preview = teamATable.tableHtml.substring(0, 500).replace(/\s+/g, ' ');
        console.log(`[Goal Stats] Preview tabela Time A (primeiros 500 chars): ${preview}`);
      }
      console.log(`[Goal Stats] Tabela Time B: ${teamBTable ? `"${teamBTable.teamName}" (${teamBTable.tableHtml.length} chars)` : 'NÃO ENCONTRADA'}`);
      if (teamBTable) {
        const preview = teamBTable.tableHtml.substring(0, 500).replace(/\s+/g, ' ');
        console.log(`[Goal Stats] Preview tabela Time B (primeiros 500 chars): ${preview}`);
      }
      
      if (!teamATable) {
        console.error(`[Goal Stats] ⚠⚠⚠ ERRO: Nenhuma tabela encontrada para Time A (${matchInfo.teamA})!`);
        console.error(`[Goal Stats] Tabelas disponíveis: ${allGoalStatsTables.map(t => `"${t.teamName}"`).join(', ')}`);
      }
      if (!teamBTable) {
        console.error(`[Goal Stats] ⚠⚠⚠ ERRO: Nenhuma tabela encontrada para Time B (${matchInfo.teamB})!`);
        console.error(`[Goal Stats] Tabelas disponíveis: ${allGoalStatsTables.map(t => `"${t.teamName}"`).join(', ')}`);
      }
      
      // Extrai stats de cada tabela
      console.log(`[Goal Stats] Extraindo stats do Time A (${matchInfo.teamA})...`);
      let teamAGoalStatsHome = teamATable ? extractGoalStatsFromTable(teamATable.tableHtml, 'home') : extractGoalStats(html, matchInfo.teamA, 'home');
      let teamAGoalStatsAway = teamATable ? extractGoalStatsFromTable(teamATable.tableHtml, 'away') : extractGoalStats(html, matchInfo.teamA, 'away');
      let teamAGoalStatsGlobal = teamATable ? extractGoalStatsFromTable(teamATable.tableHtml, 'global') : extractGoalStats(html, matchInfo.teamA, 'global');
      
      // Se os valores estão zerados, tenta busca direta no HTML
      if (teamAGoalStatsHome.avgGoalsScored === 0 && teamAGoalStatsHome.avgGoalsConceded === 0) {
        console.log(`[Goal Stats] Time A: Valores zerados, tentando busca direta no HTML...`);
        const directStats = extractGoalStatsDirectly(html, matchInfo.teamA, 'home');
        if (directStats.avgGoalsScored > 0 || directStats.avgGoalsConceded > 0) {
          teamAGoalStatsHome = directStats;
          console.log(`[Goal Stats] Time A: Usando dados da busca direta!`);
        }
      }
      
      console.log(`[Goal Stats] Extraindo stats do Time B (${matchInfo.teamB})...`);
      let teamBGoalStatsHome = teamBTable ? extractGoalStatsFromTable(teamBTable.tableHtml, 'home') : extractGoalStats(html, matchInfo.teamB, 'home');
      let teamBGoalStatsAway = teamBTable ? extractGoalStatsFromTable(teamBTable.tableHtml, 'away') : extractGoalStats(html, matchInfo.teamB, 'away');
      let teamBGoalStatsGlobal = teamBTable ? extractGoalStatsFromTable(teamBTable.tableHtml, 'global') : extractGoalStats(html, matchInfo.teamB, 'global');
      
      // Se os valores estão zerados, tenta busca direta no HTML
      if (teamBGoalStatsHome.avgGoalsScored === 0 && teamBGoalStatsHome.avgGoalsConceded === 0) {
        console.log(`[Goal Stats] Time B: Valores zerados, tentando busca direta no HTML...`);
        const directStats = extractGoalStatsDirectly(html, matchInfo.teamB, 'home');
        if (directStats.avgGoalsScored > 0 || directStats.avgGoalsConceded > 0) {
          teamBGoalStatsHome = directStats;
          console.log(`[Goal Stats] Time B: Usando dados da busca direta!`);
        }
      }
      
      console.log(`[Goal Stats] RESULTADO IMEDIATO Time A Home: Marcados=${teamAGoalStatsHome.avgGoalsScored}, Sofridos=${teamAGoalStatsHome.avgGoalsConceded}`);
      console.log(`[Goal Stats] RESULTADO IMEDIATO Time B Home: Marcados=${teamBGoalStatsHome.avgGoalsScored}, Sofridos=${teamBGoalStatsHome.avgGoalsConceded}`);
      
      const teamAGoalStats = {
        home: teamAGoalStatsHome,
        away: teamAGoalStatsAway,
        global: teamAGoalStatsGlobal
      };
      
      const teamBGoalStats = {
        home: teamBGoalStatsHome,
        away: teamBGoalStatsAway,
        global: teamBGoalStatsGlobal
      };
      
      // Validação completa: verifica se os dados são diferentes (não devem ser iguais)
      const checkDuplication = (scope: 'home' | 'away' | 'global') => {
        const teamA = teamAGoalStats[scope];
        const teamB = teamBGoalStats[scope];
        
        // Verifica múltiplos campos para detectar duplicação
        const isDuplicated = 
          teamA.avgGoalsScored > 0 && teamB.avgGoalsScored > 0 && 
          teamA.avgGoalsScored === teamB.avgGoalsScored &&
          teamA.avgGoalsConceded > 0 && teamB.avgGoalsConceded > 0 &&
          teamA.avgGoalsConceded === teamB.avgGoalsConceded &&
          teamA.over25Pct > 0 && teamB.over25Pct > 0 &&
          teamA.over25Pct === teamB.over25Pct;
        
        if (isDuplicated) {
          console.error(`[Goal Stats] ⚠⚠⚠ ERRO CRÍTICO: Dados DUPLICADOS detectados no escopo ${scope}!`);
          console.error(`[Goal Stats] Time A (${matchInfo.teamA}) ${scope}: Marcados=${teamA.avgGoalsScored}, Sofridos=${teamA.avgGoalsConceded}, >2.5=${teamA.over25Pct}%`);
          console.error(`[Goal Stats] Time B (${matchInfo.teamB}) ${scope}: Marcados=${teamB.avgGoalsScored}, Sofridos=${teamB.avgGoalsConceded}, >2.5=${teamB.over25Pct}%`);
          console.error(`[Goal Stats] ⚠ Isso indica que a mesma tabela foi usada para ambos os times!`);
        }
        
        return isDuplicated;
      };
      
      const hasHomeDuplication = checkDuplication('home');
      const hasAwayDuplication = checkDuplication('away');
      const hasGlobalDuplication = checkDuplication('global');
      
      if (hasHomeDuplication || hasAwayDuplication || hasGlobalDuplication) {
        console.error(`[Goal Stats] ⚠⚠⚠ PROBLEMA DETECTADO: Dados duplicados encontrados em um ou mais escopos!`);
        console.error(`[Goal Stats] Isso pode indicar que a busca de tabelas não está funcionando corretamente.`);
      }
      
      console.log(`[Goal Stats] ===== RESUMO FINAL =====`);
      console.log(`[Goal Stats] Time A (${matchInfo.teamA}):`, {
        home: `Marcados=${teamAGoalStats.home.avgGoalsScored}, Sofridos=${teamAGoalStats.home.avgGoalsConceded}, >2.5=${teamAGoalStats.home.over25Pct}%`,
        away: `Marcados=${teamAGoalStats.away.avgGoalsScored}, Sofridos=${teamAGoalStats.away.avgGoalsConceded}, >2.5=${teamAGoalStats.away.over25Pct}%`,
        global: `Marcados=${teamAGoalStats.global.avgGoalsScored}, Sofridos=${teamAGoalStats.global.avgGoalsConceded}, >2.5=${teamAGoalStats.global.over25Pct}%`
      });
      
      console.log(`[Goal Stats] Time B (${matchInfo.teamB}):`, {
        home: `Marcados=${teamBGoalStats.home.avgGoalsScored}, Sofridos=${teamBGoalStats.home.avgGoalsConceded}, >2.5=${teamBGoalStats.home.over25Pct}%`,
        away: `Marcados=${teamBGoalStats.away.avgGoalsScored}, Sofridos=${teamBGoalStats.away.avgGoalsConceded}, >2.5=${teamBGoalStats.away.over25Pct}%`,
        global: `Marcados=${teamBGoalStats.global.avgGoalsScored}, Sofridos=${teamBGoalStats.global.avgGoalsConceded}, >2.5=${teamBGoalStats.global.over25Pct}%`
      });
      
      // Log detalhado dos resultados
      console.log(`=== RESUMO GOAL STATS ===`);
      console.log(`Time A (${matchInfo.teamA}):`);
      console.log(`  Casa: Marcados=${teamAGoalStats.home.avgGoalsScored}, Sofridos=${teamAGoalStats.home.avgGoalsConceded}, >2.5=${teamAGoalStats.home.over25Pct}%`);
      console.log(`  Fora: Marcados=${teamAGoalStats.away.avgGoalsScored}, Sofridos=${teamAGoalStats.away.avgGoalsConceded}, >2.5=${teamAGoalStats.away.over25Pct}%`);
      console.log(`  Global: Marcados=${teamAGoalStats.global.avgGoalsScored}, Sofridos=${teamAGoalStats.global.avgGoalsConceded}, >2.5=${teamAGoalStats.global.over25Pct}%`);
      console.log(`Time B (${matchInfo.teamB}):`);
      console.log(`  Casa: Marcados=${teamBGoalStats.home.avgGoalsScored}, Sofridos=${teamBGoalStats.home.avgGoalsConceded}, >2.5=${teamBGoalStats.home.over25Pct}%`);
      console.log(`  Fora: Marcados=${teamBGoalStats.away.avgGoalsScored}, Sofridos=${teamBGoalStats.away.avgGoalsConceded}, >2.5=${teamBGoalStats.away.over25Pct}%`);
      console.log(`  Global: Marcados=${teamBGoalStats.global.avgGoalsScored}, Sofridos=${teamBGoalStats.global.avgGoalsConceded}, >2.5=${teamBGoalStats.global.over25Pct}%`);
      
      console.log(`Goal Stats extraídos: ${matchInfo.teamA} (Casa: ${teamAGoalStats.home.avgGoalsScored}, Fora: ${teamAGoalStats.away.avgGoalsScored}) e ${matchInfo.teamB} (Casa: ${teamBGoalStats.home.avgGoalsScored}, Fora: ${teamBGoalStats.away.avgGoalsScored})`);

      // Retorna os dados extraídos
      return res.status(200).json({
        success: true,
        matchId: matchId || 'unknown',
        data: {
          teamAForm,
          teamBForm,
          h2hData,
          standingsData: finalStandings,
          teamAStreaks,
          teamBStreaks,
          teamAOpponentAnalysis,
          teamBOpponentAnalysis,
          teamAGoalStats,
          teamBGoalStats
        },
        message: 'Detalhes da partida processados com sucesso',
        debug: {
          teamAFormCount: teamAForm.length,
          teamBFormCount: teamBForm.length,
          h2hCount: h2hData.length,
          standingsCount: standingsData.length,
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


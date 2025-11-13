import type { MatchDetails, Match, Standing } from '../types';

// Gemini AI não está sendo usado - função desabilitada
let ai: any = null;

function formatMatchHistory(matches: Match[], perspectiveTeam: string): string {
    return matches.slice(0, 5).map(m => {
        const isHome = m.homeTeam === perspectiveTeam;
        const opponent = isHome ? m.awayTeam : m.homeTeam;
        const score = `${m.homeScore}-${m.awayScore}`;
        let result: 'V' | 'E' | 'D' = 'E';
        if (Number(m.homeScore) > Number(m.awayScore)) {
            result = isHome ? 'V' : 'D';
        } else if (Number(m.awayScore) > Number(m.homeScore)) {
            result = isHome ? 'D' : 'V';
        }
        return `vs ${opponent}: ${score} (${result})`;
    }).join(', ');
}

function formatStandings(standings: Standing[], teamA: string, teamB: string): string {
    const teamAStanding = standings.find(s => s.team === teamA);
    const teamBStanding = standings.find(s => s.team === teamB);
    let result = '';
    if (teamAStanding) {
        result += `${teamA}: Posição ${teamAStanding.position}, ${teamAStanding.points} pontos em ${teamAStanding.played} jogos. `;
    }
    if (teamBStanding) {
        result += `${teamB}: Posição ${teamBStanding.position}, ${teamBStanding.points} pontos em ${teamBStanding.played} jogos.`;
    }
    return result;
}


export async function generateMatchAnalysis(match: MatchDetails): Promise<string> {
    // Gemini AI não está configurado - retorna mensagem informativa
    return `## Análise de IA não disponível

A funcionalidade de análise com IA (Gemini) não está configurada neste projeto.

Você pode usar as outras abas para visualizar:
- **Visão Geral**: Estatísticas e probabilidades
- **Análise de Gols**: Médias e percentuais
- **Confronto Direto**: Histórico entre as equipes
- **Classificação**: Tabela da competição

Para habilitar a análise com IA, configure a API do Google Gemini.`;
}

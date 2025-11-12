import { GoogleGenAI } from "@google/genai";
import type { MatchDetails, Match, Standing } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
    const { teamA, teamB, h2hData, teamAForm, teamBForm, standingsData, teamAGoalStats, teamBGoalStats, matchInfo } = match;

    const prompt = `
        Você é um especialista em análise de futebol brasileiro. Sua tarefa é fornecer uma análise pré-jogo detalhada para a partida entre ${teamA.name} e ${teamB.name} pela competição ${matchInfo.competition}.

        Baseado nos dados a seguir, escreva uma análise completa em português brasileiro. A análise deve ser estruturada com os seguintes tópicos em markdown:
        - **Visão Geral da Partida**: Um parágrafo introdutório sobre o confronto.
        - **Análise do ${teamA.name}**: Pontos fortes, pontos fracos e momento atual da equipe.
        - **Análise do ${teamB.name}**: Pontos fortes, pontos fracos e momento atual da equipe.
        - **Confronto Direto (H2H)**: Um resumo dos últimos encontros.
        - **Pontos-Chave para a Partida**: Fatores que podem decidir o jogo (ex: Duelo tático, jogadores importantes, etc.).
        - **Prognóstico**: Sua previsão para o resultado mais provável, com uma breve justificativa.

        ---
        **Dados Disponíveis:**

        1.  **Equipes**: ${teamA.name} (mandante) vs ${teamB.name} (visitante).
        2.  **Competição**: ${matchInfo.competition}.
        3.  **Classificação na Liga**: ${formatStandings(standingsData, teamA.name, teamB.name)}.
        4.  **Últimos 5 jogos do ${teamA.name}**: ${formatMatchHistory(teamAForm, teamA.name)}.
        5.  **Últimos 5 jogos do ${teamB.name}**: ${formatMatchHistory(teamBForm, teamB.name)}.
        6.  **Últimos 5 confrontos diretos**: ${formatMatchHistory(h2hData, teamA.name)}.
        7.  **Estatísticas de Gols (${teamA.name})**: Média de gols marcados (geral): ${teamAGoalStats.global.avgGoalsScored.toFixed(2)}, Média de gols sofridos (geral): ${teamAGoalStats.global.avgGoalsConceded.toFixed(2)}. Em casa, marca em média ${teamAGoalStats.home.avgGoalsScored.toFixed(2)} e sofre ${teamAGoalStats.home.avgGoalsConceded.toFixed(2)}.
        8.  **Estatísticas de Gols (${teamB.name})**: Média de gols marcados (geral): ${teamBGoalStats.global.avgGoalsScored.toFixed(2)}, Média de gols sofridos (geral): ${teamBGoalStats.global.avgGoalsConceded.toFixed(2)}. Fora de casa, marca em média ${teamBGoalStats.away.avgGoalsScored.toFixed(2)} e sofre ${teamBGoalStats.away.avgGoalsConceded.toFixed(2)}.
        ---

        Seja conciso, mas informativo. Use os dados para embasar sua análise.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating analysis:", error);
        throw new Error("Não foi possível gerar a análise. Verifique a chave de API e tente novamente.");
    }
}

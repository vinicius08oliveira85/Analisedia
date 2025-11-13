import React, { useState } from 'react';
import type { MatchDetails } from '../types';
import { generateMatchAnalysis } from '../services/geminiService';
import { Card } from './Card';

const AnalysisDisplay: React.FC<{ analysis: string }> = ({ analysis }) => (
    <div className="text-gray-300 bg-gray-900/50 p-2 sm:p-3 rounded-lg whitespace-pre-wrap font-sans leading-relaxed text-left text-[10px] sm:text-xs">
        {analysis}
    </div>
);

export const GeminiAnalysis: React.FC<{ match: MatchDetails }> = ({ match }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await generateMatchAnalysis(match);
            setAnalysis(result);
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Ocorreu um erro desconhecido.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Análise com IA (Gemini)" className="border border-green-500/30">
            <div className="text-center p-2 sm:p-3">
                {!isLoading && !analysis && !error && (
                    <>
                        <p className="text-gray-400 mb-2 sm:mb-3 text-[10px] sm:text-xs">
                           Clique no botão abaixo para gerar uma análise pré-jogo detalhada usando a IA do Google.
                        </p>
                        <button
                            onClick={handleGenerateAnalysis}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded text-[10px] sm:text-xs transition-transform duration-200 hover:scale-105 shadow-lg flex items-center justify-center mx-auto"
                        >
                             <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Gerar Análise
                        </button>
                    </>
                )}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-gray-300">
                        <svg className="animate-spin h-8 w-8 text-green-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-semibold">Analisando dados, por favor aguarde...</p>
                        <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos.</p>
                    </div>
                )}
                {error && (
                     <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative text-left" role="alert">
                        <strong className="font-bold">Erro! </strong>
                        <span className="block sm:inline">{error}</span>
                        <button onClick={handleGenerateAnalysis} className="text-sm font-semibold underline ml-4">Tentar novamente</button>
                    </div>
                )}
                {analysis && (
                    <div className="text-left">
                        <AnalysisDisplay analysis={analysis} />
                    </div>
                )}
            </div>
        </Card>
    );
};

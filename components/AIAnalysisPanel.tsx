import React from 'react';
import { AIAnalysisResult } from '../types';
import { Sparkles, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

interface AIAnalysisPanelProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ analysis, loading, onAnalyze }) => {
  return (
    <div className="mt-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="text-purple-500 w-5 h-5" />
          Análise Inteligente (Gemini AI)
        </h3>
        {!analysis && !loading && (
          <button
            onClick={onAnalyze}
            className="px-4 py-2 bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-600 hover:to-violet-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Análise
          </button>
        )}
      </div>

      {loading && (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
          <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
          <div className="h-4 bg-zinc-800 rounded w-full"></div>
        </div>
      )}

      {analysis && !loading && (
        <div className="animate-fade-in">
          <div className={`p-4 rounded-lg mb-4 border-l-4 ${analysis.isSustainable ? 'bg-emerald-900/20 border-emerald-500' : 'bg-amber-900/20 border-amber-500'}`}>
            <div className="flex items-start gap-3">
              {analysis.isSustainable ? (
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className={`font-semibold ${analysis.isSustainable ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {analysis.isSustainable ? 'Precificação Saudável' : 'Atenção à Sustentabilidade'}
                </h4>
                <p className="text-zinc-300 text-sm mt-1 leading-relaxed">
                  {analysis.analysis}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Dicas Estratégicas
            </h4>
            <ul className="space-y-2">
              {analysis.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300 bg-zinc-800/50 p-2 rounded">
                  <span className="text-purple-500 font-bold">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          
          <button
            onClick={onAnalyze}
            className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Atualizar Análise
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
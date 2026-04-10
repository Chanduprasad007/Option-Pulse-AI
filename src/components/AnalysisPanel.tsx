import React from 'react';
import { Brain, ShieldAlert, Target, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { MarketAnalysis } from '@/src/services/geminiService';
import { cn } from '@/src/lib/utils';

interface AnalysisPanelProps {
  analysis: MarketAnalysis | null;
  loading: boolean;
}

export function AnalysisPanel({ analysis, loading }: AnalysisPanelProps) {
  if (loading) {
    return (
      <div className="bg-[#151619] border border-[#2A2D32] rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Brain className="w-12 h-12 text-[#4A90E2]" />
        </motion.div>
        <p className="text-[#8E9299] font-mono text-sm animate-pulse">AI is analyzing world events and market trends...</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151619] border border-[#2A2D32] rounded-xl overflow-hidden"
    >
      <div className="p-4 border-b border-[#2A2D32] bg-[#1A1D21] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#4A90E2]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">AI Strategy Advisor</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8E9299] font-mono uppercase">Confidence:</span>
          <div className="w-24 h-1.5 bg-[#2A2D32] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.confidence}%` }}
              className="h-full bg-[#4A90E2]"
            />
          </div>
          <span className="text-[10px] text-white font-mono">{analysis.confidence}%</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#8E9299]" />
              <h3 className="text-xs font-mono text-[#8E9299] uppercase">Suggested Strategy</h3>
            </div>
            <div className="p-4 bg-[#1A1D21] border border-[#2A2D32] rounded-lg">
              <span className={cn(
                "text-lg font-bold block mb-1",
                analysis.sentiment === 'Bullish' ? "text-emerald-500" :
                analysis.sentiment === 'Bearish' ? "text-rose-500" : "text-amber-500"
              )}>
                {analysis.sentiment} Outlook
              </span>
              <p className="text-white font-medium">{analysis.suggestedStrategy}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-[#8E9299]" />
              <h3 className="text-xs font-mono text-[#8E9299] uppercase">Risk Assessment</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                "px-4 py-2 rounded-lg border font-bold text-sm",
                analysis.riskLevel === 'Low' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                analysis.riskLevel === 'Medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                "bg-rose-500/10 border-rose-500/20 text-rose-500"
              )}>
                {analysis.riskLevel} Risk
              </div>
              <p className="text-xs text-[#8E9299] leading-relaxed">
                Based on current volatility and upcoming global triggers.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-[#8E9299]" />
              <h3 className="text-xs font-mono text-[#8E9299] uppercase">Market Reasoning</h3>
            </div>
            <p className="text-sm text-[#E6E6E6] leading-relaxed bg-[#1A1D21]/50 p-4 rounded-lg border border-[#2A2D32]/50">
              {analysis.reasoning}
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-mono text-[#5A5E66] uppercase mb-2">Key Triggers Analyzed</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keyEvents.map((event, idx) => (
                <span key={idx} className="text-[10px] bg-[#2A2D32] text-[#8E9299] px-2 py-1 rounded">
                  {event}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface MarketCardProps {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export const MarketCard: React.FC<MarketCardProps> = ({ name, value, change, changePercent }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-[#151619] border border-[#2A2D32] p-6 rounded-xl shadow-lg hover:border-[#4A4D52] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[#8E9299] font-mono text-xs uppercase tracking-wider">{name}</h3>
        {isPositive ? (
          <TrendingUp className="text-emerald-500 w-4 h-4" />
        ) : (
          <TrendingDown className="text-rose-500 w-4 h-4" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white font-mono">
          {value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
        <div className={cn(
          "flex items-center gap-2 text-sm mt-1 font-medium",
          isPositive ? "text-emerald-500" : "text-rose-500"
        )}>
          <span>{isPositive ? '+' : ''}{change.toFixed(2)}</span>
          <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  );
}

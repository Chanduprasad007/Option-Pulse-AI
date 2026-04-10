import React from 'react';
import { Globe, Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface NewsSectionProps {
  news: NewsItem[];
}

export function NewsSection({ news }: NewsSectionProps) {
  return (
    <div className="bg-[#151619] border border-[#2A2D32] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#2A2D32] bg-[#1A1D21] flex items-center gap-2">
        <Globe className="w-4 h-4 text-[#8E9299]" />
        <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Global Events</h2>
      </div>
      <div className="divide-y divide-[#2A2D32]">
        {news.map((item) => (
          <div key={item.id} className="p-4 hover:bg-[#1A1D21] transition-colors group cursor-pointer">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-mono text-[#8E9299] uppercase">{item.source}</span>
              <div className="flex items-center gap-1 text-[10px] text-[#5A5E66]">
                <Clock className="w-3 h-3" />
                {item.time}
              </div>
            </div>
            <h3 className="text-sm text-[#E6E6E6] group-hover:text-white transition-colors leading-snug">
              {item.title}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-tighter",
                item.impact === 'High' ? "bg-rose-500/10 text-rose-500" :
                item.impact === 'Medium' ? "bg-amber-500/10 text-amber-500" :
                "bg-emerald-500/10 text-emerald-500"
              )}>
                {item.impact} Impact
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

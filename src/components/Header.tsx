import React from 'react';
import { Activity, Shield, Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-[#2A2D32] bg-[#151619] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#4A90E2] rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">OptionPulse <span className="text-[#4A90E2]">AI</span></h1>
            <p className="text-[10px] text-[#8E9299] font-mono uppercase tracking-widest">Market Intelligence Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-xs font-mono text-white hover:text-[#4A90E2] transition-colors">DASHBOARD</a>
            <a href="#" className="text-xs font-mono text-[#8E9299] hover:text-white transition-colors">STRATEGIES</a>
            <a href="#" className="text-xs font-mono text-[#8E9299] hover:text-white transition-colors">HISTORICAL</a>
          </nav>
          
          <div className="flex items-center gap-3 border-l border-[#2A2D32] pl-6">
            <button className="p-2 text-[#8E9299] hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-[#1A1D21] border border-[#2A2D32] px-3 py-1.5 rounded-full">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-mono text-white uppercase">Live Feed</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

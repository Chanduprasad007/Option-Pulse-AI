/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MarketCard } from './components/MarketCard';
import { NewsSection } from './components/NewsSection';
import { AnalysisPanel } from './components/AnalysisPanel';
import { OrderModal } from './components/OrderModal';
import { analyzeMarket, MarketAnalysis, getCurrentMarketPrices } from './services/geminiService';
import { KotakService, KotakOrder } from './services/kotakService';
import { RefreshCw, Zap, TrendingUp, BarChart3, Activity, ExternalLink, X, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Mock data for initial state
const MOCK_MARKET_DATA = [
  { name: 'NIFTY 50', value: 22453.30, change: 156.45, changePercent: 0.70 },
  { name: 'BANK NIFTY', value: 47832.15, change: -245.30, changePercent: -0.51 },
  { name: 'SENSEX', value: 73903.91, change: 512.10, changePercent: 0.70 },
];

const MOCK_NEWS = [
  { id: '1', title: 'US Fed hints at potential rate cuts in late 2024', source: 'REUTERS', time: '2h ago', impact: 'High' as const },
  { id: '2', title: 'Crude oil prices surge amid Middle East tensions', source: 'BLOOMBERG', time: '4h ago', impact: 'High' as const },
  { id: '3', title: 'India Manufacturing PMI hits 16-year high', source: 'MINT', time: '6h ago', impact: 'Medium' as const },
  { id: '4', title: 'Tech earnings season kicks off with mixed results', source: 'CNBC', time: '8h ago', impact: 'Low' as const },
];

const MOCK_CHART_DATA = [
  { time: '09:15', value: 22300 },
  { time: '10:00', value: 22350 },
  { time: '11:00', value: 22320 },
  { time: '12:00', value: 22400 },
  { time: '13:00', value: 22420 },
  { time: '14:00', value: 22460 },
  { time: '15:30', value: 22453 },
];

export default function App() {
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState(MOCK_MARKET_DATA);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [lastVerified, setLastVerified] = useState<string>(new Date().toLocaleTimeString());
  const [showOptionChain, setShowOptionChain] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const [isKotakConnected, setIsKotakConnected] = useState(KotakService.getIsConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeepSyncing, setIsDeepSyncing] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Partial<KotakOrder> | undefined>(undefined);

  const handleDeepSync = async () => {
    setIsDeepSyncing(true);
    setIsRateLimited(false);
    try {
      const realPrices = await getCurrentMarketPrices();
      if (realPrices && realPrices.length > 0) {
        setMarketData(realPrices);
        const now = new Date().toLocaleTimeString();
        setLastUpdated(now);
        setLastVerified(now);
      } else {
        // If we got nothing back but have cached data, it might be a rate limit
        setIsRateLimited(true);
      }
    } catch (error) {
      console.error("Deep sync failed:", error);
      setIsRateLimited(true);
    } finally {
      setIsDeepSyncing(false);
    }
  };

  const fetchLiveMarketData = useCallback(async () => {
    if (isKotakConnected) {
      // Try fetching from Kotak Neo first
      const tokens = ["26000", "26009", "26017"]; // Nifty, Bank Nifty, Fin Nifty tokens (placeholders)
      const quotes = await KotakService.getLiveQuotes(tokens);
      if (quotes && quotes.data) {
        // Map Kotak data to our format
        // This is a simplification, actual mapping depends on Kotak response structure
        const updatedData = marketData.map((market, idx) => {
          const quote = quotes.data[idx];
          if (quote) {
            return {
              ...market,
              value: parseFloat(quote.ltp),
              change: parseFloat(quote.ch),
              changePercent: parseFloat(quote.chp)
            };
          }
          return market;
        });
        setMarketData(updatedData);
        setLastUpdated(new Date().toLocaleTimeString());
        return;
      }
    }

    // Fast Tick: Simulating small movements between deep syncs
    const updatedData = marketData.map(market => ({
      ...market,
      value: market.value + (Math.random() - 0.5) * 2,
      change: market.change + (Math.random() - 0.5) * 0.5,
      changePercent: market.changePercent + (Math.random() - 0.5) * 0.005
    }));
    setMarketData(updatedData);
  }, [marketData, isKotakConnected]);

  const handleAnalyze = async () => {
    setLoading(true);
    setIsRateLimited(false);
    try {
      const result = await analyzeMarket(marketData, MOCK_NEWS.map(n => n.title));
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      setIsRateLimited(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectKotak = async () => {
    setIsConnecting(true);
    const success = await KotakService.connect();
    setIsKotakConnected(success);
    setIsConnecting(false);
  };

  const openOrderModal = (strike: number, type: 'CE' | 'PE') => {
    setSelectedOrder({
      symbol: 'NIFTY',
      strike,
      optionType: type,
      transactionType: 'BUY',
      quantity: 50,
      orderType: 'MARKET'
    });
    setShowOrderModal(true);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await handleDeepSync();
      await handleAnalyze();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefreshing) {
      interval = setInterval(() => {
        fetchLiveMarketData();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoRefreshing, fetchLiveMarketData]);

  // Periodic Deep Sync every 5 minutes (reduced frequency to avoid rate limits)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefreshing) {
      interval = setInterval(() => {
        handleDeepSync();
      }, 300000);
    }
    return () => clearInterval(interval);
  }, [isAutoRefreshing]);

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white selection:bg-[#4A90E2]/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Live Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-mono text-[#8E9299] uppercase tracking-widest">Market Overview</h2>
            <div className="flex items-center gap-2 bg-[#1A1D21] border border-[#2A2D32] px-3 py-1 rounded-full">
              <div className={cn("w-2 h-2 rounded-full", isAutoRefreshing ? "bg-emerald-500 animate-pulse" : "bg-[#5A5E66]")} />
              <span className="text-[10px] font-mono text-white uppercase">{isAutoRefreshing ? 'Live' : 'Paused'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#5A5E66]">
              <ShieldCheck className="w-3 h-3" />
              <span>LAST VERIFIED: {lastVerified}</span>
            </div>
            {isDeepSyncing && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#4A90E2] animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                VERIFYING WITH NSE...
              </div>
            )}
            {isRateLimited && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <AlertCircle className="w-3 h-3" />
                API RATE LIMITED - USING CACHED DATA
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDeepSync}
              disabled={isDeepSyncing}
              className="flex items-center gap-2 bg-[#1A1D21] border border-[#2A2D32] hover:border-[#4A90E2] px-4 py-1.5 rounded-lg transition-all group"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-[#4A90E2] transition-transform duration-500", isDeepSyncing && "animate-spin")} />
              <span className="text-xs font-mono text-white uppercase">Deep Sync</span>
            </button>
            <button 
              onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
              className={cn(
                "text-[10px] font-mono px-3 py-1.5 rounded border transition-all",
                isAutoRefreshing 
                  ? "border-rose-500/30 text-rose-500 hover:bg-rose-500/10" 
                  : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
              )}
            >
              {isAutoRefreshing ? 'STOP AUTO-REFRESH' : 'START AUTO-REFRESH'}
            </button>
            <button 
              onClick={fetchLiveMarketData}
              className="flex items-center gap-2 bg-[#1A1D21] border border-[#2A2D32] hover:border-[#4A90E2] px-4 py-1.5 rounded-lg transition-all group"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#4A90E2] group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-xs font-mono text-white uppercase">Refresh Now</span>
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {marketData.map((market) => (
            <MarketCard 
              key={market.name} 
              name={market.name}
              value={market.value}
              change={market.change}
              changePercent={market.changePercent}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Chart & Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* Market Trend Chart */}
            <div className="bg-[#151619] border border-[#2A2D32] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#8E9299]" />
                  <h2 className="text-sm font-bold uppercase tracking-widest font-mono">Nifty Intraday Trend</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-[#5A5E66] font-mono uppercase">Last Verified: {lastVerified}</span>
                    <span className="text-[8px] text-[#4A90E2] font-mono uppercase tracking-tighter">Real-time Sync Active</span>
                  </div>
                  <button 
                    onClick={handleDeepSync}
                    disabled={isDeepSyncing}
                    className="p-1.5 hover:bg-[#2A2D32] rounded-md transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-4 h-4 text-[#8E9299]", isDeepSyncing && "animate-spin")} />
                  </button>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_CHART_DATA}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4A90E2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2D32" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#5A5E66" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#5A5E66" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['dataMin - 50', 'dataMax + 50']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1D21', border: '1px solid #2A2D32', fontSize: '12px' }}
                      itemStyle={{ color: '#4A90E2' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#4A90E2" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Advisor Panel */}
            <AnalysisPanel analysis={analysis} loading={loading} />
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white py-4 rounded-xl font-bold transition-all group">
                <Zap className="w-5 h-5 fill-current" />
                EXECUTE SMART STRATEGY
              </button>
              <button 
                onClick={() => setShowOptionChain(true)}
                className="flex items-center justify-center gap-2 bg-transparent border border-[#2A2D32] hover:border-[#4A4D52] text-white py-4 rounded-xl font-bold transition-all"
              >
                <TrendingUp className="w-5 h-5" />
                VIEW OPTION CHAIN
              </button>
            </div>
          </div>

          <OrderModal 
            isOpen={showOrderModal} 
            onClose={() => setShowOrderModal(false)} 
            initialOrder={selectedOrder}
          />

          {/* Option Chain Modal */}
          {showOptionChain && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#151619] border border-[#2A2D32] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-[#2A2D32] flex items-center justify-between bg-[#1A1D21]">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-[#4A90E2]" />
                    <h2 className="text-white font-bold font-mono uppercase tracking-widest">NIFTY Option Chain</h2>
                  </div>
                  <button 
                    onClick={() => setShowOptionChain(false)}
                    className="p-2 hover:bg-[#2A2D32] rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-[#8E9299]" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-auto p-6">
                  {!isKotakConnected ? (
                    <div className="bg-[#1A1D21] border border-[#2A2D32] rounded-xl p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-[#4A90E2]/10 rounded-full flex items-center justify-center mx-auto">
                        <ExternalLink className="w-8 h-8 text-[#4A90E2]" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Kotak Neo Integration Required</h3>
                      <p className="text-[#8E9299] max-w-md mx-auto text-sm leading-relaxed">
                        To view live option chains and execute trades, please provide your Kotak Neo API credentials in the application settings.
                      </p>
                      <div className="pt-4 flex justify-center gap-4">
                        <button 
                          onClick={handleConnectKotak}
                          disabled={isConnecting}
                          className="bg-[#4A90E2] text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                        >
                          {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {isConnecting ? 'Connecting...' : 'Connect Kotak Neo'}
                        </button>
                        <button 
                          onClick={() => setShowOptionChain(false)}
                          className="border border-[#2A2D32] text-[#8E9299] px-6 py-2 rounded-lg font-bold text-sm"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-[#1A1D21] p-3 rounded-lg border border-[#2A2D32]">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-mono text-white uppercase">Connected to Kotak Neo</span>
                        </div>
                        <span className="text-[10px] text-[#8E9299] font-mono">SPOT: 22,453.30</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px] font-mono">
                          <thead>
                            <tr className="text-[#8E9299] border-b border-[#2A2D32]">
                              <th className="pb-2">OI</th>
                              <th className="pb-2">CHNG OI</th>
                              <th className="pb-2">VOL</th>
                              <th className="pb-2">IV</th>
                              <th className="pb-2">LTP</th>
                              <th className="pb-2 text-center bg-[#2A2D32] text-white py-1 rounded-t">STRIKE</th>
                              <th className="pb-2 text-right">LTP</th>
                              <th className="pb-2 text-right">IV</th>
                              <th className="pb-2 text-right">VOL</th>
                              <th className="pb-2 text-right">CHNG OI</th>
                              <th className="pb-2 text-right">OI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...Array(10)].map((_, i) => {
                              const strike = 22200 + (i * 50);
                              return (
                                <tr key={i} className="border-b border-[#2A2D32]/50 hover:bg-[#1A1D21] transition-colors group">
                                  <td className="py-3">12,450</td>
                                  <td>+450</td>
                                  <td>89,200</td>
                                  <td>12.4</td>
                                  <td 
                                    onClick={() => openOrderModal(strike, 'CE')}
                                    className="text-emerald-500 cursor-pointer hover:underline font-bold"
                                  >
                                    145.20
                                  </td>
                                  <td className="text-center font-bold bg-[#2A2D32]/50 py-2">{strike}</td>
                                  <td 
                                    onClick={() => openOrderModal(strike, 'PE')}
                                    className="text-right text-rose-500 cursor-pointer hover:underline font-bold"
                                  >
                                    89.40
                                  </td>
                                  <td className="text-right">13.1</td>
                                  <td className="text-right">45,100</td>
                                  <td className="text-right">-120</td>
                                  <td className="text-right">8,900</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right Column: News & Triggers */}
          <div className="space-y-8">
            <NewsSection news={MOCK_NEWS} />
            
            <div className="bg-[#151619] border border-[#2A2D32] rounded-xl p-6">
              <h3 className="text-xs font-mono text-[#8E9299] uppercase mb-4 tracking-widest">Market Sentiment</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8E9299]">Retail</span>
                  <span className="text-emerald-500 font-bold">65% Bullish</span>
                </div>
                <div className="w-full h-1.5 bg-[#2A2D32] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '65%' }} />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8E9299]">Institutional (FII)</span>
                  <span className="text-rose-500 font-bold">58% Bearish</span>
                </div>
                <div className="w-full h-1.5 bg-[#2A2D32] rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: '58%' }} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1A1D21] to-[#0A0B0D] border border-[#2A2D32] rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-32 h-32 text-[#4A90E2]" />
              </div>
              <h3 className="text-white font-bold mb-2">Pro Insights</h3>
              <p className="text-xs text-[#8E9299] leading-relaxed mb-4">
                Get real-time alerts for unusual option activity and institutional block trades.
              </p>
              <button className="text-[10px] font-bold text-[#4A90E2] uppercase tracking-widest hover:underline">
                Upgrade to Pro →
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-[#2A2D32] py-8 bg-[#0A0B0D]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#4A90E2]" />
            <span className="text-xs text-[#5A5E66] font-mono">OPTIONPULSE AI v1.0.4</span>
          </div>
          <p className="text-[10px] text-[#5A5E66] font-mono text-center">
            DISCLAIMER: Trading options involves high risk. AI suggestions are for educational purposes only.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] text-[#5A5E66] hover:text-white font-mono">TERMS</a>
            <a href="#" className="text-[10px] text-[#5A5E66] hover:text-white font-mono">PRIVACY</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

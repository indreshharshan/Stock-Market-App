"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Eye, 
  Trash2, 
  MoreVertical,
  ChevronRight,
  BarChart3,
  Info
} from "lucide-react";
import SearchCommand from "@/components/SearchCommand";
import WatchlistButton from "@/components/WatchlistButton";
import AddAlertButton from "@/components/AddAlertButton";
import AlertsList from "@/components/AlertsList";
import MiniTrendChart from "@/components/MiniTrendChart";
import { formatPrice } from "@/lib/utils";


const TABS = [
  { id: "all", label: "All Stocks", icon: BarChart3 },
  { id: "gainers", label: "Top Gainers", icon: TrendingUp },
  { id: "losers", label: "Top Losers", icon: TrendingDown },
];

export default function WatchlistDashboard({ 
  initialWatchlist, 
  initialAlerts, 
  initialSearchStocks 
}: StockDashboardProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [prices, setPrices] = useState<Record<string, number>>(
    initialWatchlist.reduce((acc, stock) => ({ ...acc, [stock.symbol]: stock.currentPrice ?? 0 }), {})
  );




  // Summary stats
  const stats = useMemo(() => {
    const total = initialWatchlist.length;
    const sorted = [...initialWatchlist].sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
    const topGainer = sorted[0] || null;
    const topLoser = sorted[sorted.length - 1] || null;
    
    return { total, topGainer, topLoser };
  }, [initialWatchlist]);



  // Filtered stocks
  const filteredStocks = useMemo(() => {
    let list = initialWatchlist.filter(s => 
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === "gainers") list = list.filter(s => (s.changePercent ?? 0) > 0);
    if (activeTab === "losers") list = list.filter(s => (s.changePercent ?? 0) < 0);

    return list;
  }, [initialWatchlist, activeTab, searchQuery]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── HEADER SECTION ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight dashboard-gradient-text">My Watchlist</h1>
          <p className="text-gray-500 font-medium">Real-time portfolio pulse & intelligent monitoring</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Summary Stats Cards */}
          <div className="flex items-center bg-gray-800/80 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="stat-card">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            {stats.topGainer && (
              <div className="stat-card">
                <span className="stat-value text-green-400">+{stats.topGainer.changePercent?.toFixed(1)}%</span>
                <span className="stat-label">Gainer</span>
              </div>
            )}
            {stats.topLoser && (
              <div className="stat-card">
                <span className="stat-value text-red-400">{stats.topLoser.changePercent?.toFixed(1)}%</span>
                <span className="stat-label">Loser</span>
              </div>
            )}
          </div>

          <SearchCommand 
            renderAs="button" 
            label="+ Add Security" 
            initialStocks={initialSearchStocks} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── MAIN CONTENT (LIST) ─────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Controls: Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-gray-800/40 rounded-full border border-gray-700/30 w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-btn flex items-center gap-2 ${
                    activeTab === tab.id ? "tab-btn-active" : "tab-btn-inactive"
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800/50 border border-gray-700/50 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-yellow-500/50 focus:bg-gray-800 transition-all w-full sm:w-48 placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Cards Table Layout */}
          <div className="flex flex-col gap-4">
            {filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => (
                <div key={stock.symbol} className="dashboard-card group">
                  <div className="flex flex-col sm:flex-row sm:items-center px-6 py-5 gap-6">
                    {/* Company Info */}
                    <Link href={`/stocks/${stock.symbol}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center font-bold text-yellow-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        {stock.symbol.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-100 font-bold tracking-tight truncate group-hover:text-yellow-400 transition-colors">{stock.company}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 group-hover:text-gray-200 transition-colors">{stock.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {/* AI Insight Badge */}
                          <div className={`ai-insight-badge flex items-center gap-1 ${
                            (stock.changePercent ?? 0) > 2 ? "bg-green-500/10 text-green-400" :
                            (stock.changePercent ?? 0) < -2 ? "bg-red-500/10 text-red-400" :
                            "bg-blue-500/10 text-blue-400"
                          }`}>
                            <Info size={10} />
                            {(stock.changePercent ?? 0) > 2 ? "Bullish Trend" :
                             (stock.changePercent ?? 0) < -2 ? "High Volatility" :
                             "Neutral"}
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Sparkline */}
                    <div className="hidden sm:block">
                      <MiniTrendChart symbol={stock.symbol} />
                    </div>

                    {/* Price & Change */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 min-w-[100px]">
                      <div className={`text-xl font-black text-gray-50 tracking-tighter tabular-nums ${
                        // Optional real-time highlight simulation
                        ""
                      }`}>
                        ${stock.currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`flex items-center gap-1 font-bold text-sm ${
                        (stock.changePercent ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {(stock.changePercent ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {(stock.changePercent ?? 0) >= 0 ? "+" : ""}{stock.changePercent?.toFixed(2)}%
                      </div>
                    </div>

                    {/* Alert Status (custom toggle-like UI) */}
                    <div className="flex items-center gap-4 border-l border-gray-700/50 pl-6 h-full">
                       <AddAlertButton symbol={stock.symbol} company={stock.company} />
                      
                      {/* Secondary Actions */}
                      <div className="flex items-center gap-2">
                         <Link href={`/stocks/${stock.symbol}`} className="p-2 rounded-full hover:bg-gray-700/50 text-gray-500 hover:text-gray-100 transition-colors">
                            <Eye size={18} />
                         </Link>
                         <WatchlistButton 
                           symbol={stock.symbol} 
                           company={stock.company} 
                           isInWatchlist={true} 
                           showTrashIcon={true} 
                           type="icon" 
                         />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-800/30 border border-dashed border-gray-700 rounded-3xl text-center space-y-4">
                 <div className="h-20 w-20 rounded-full bg-gray-800 flex items-center justify-center text-gray-700">
                    <BarChart3 size={40} />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-300">No securities found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">You haven't added any stocks to this view yet. Start building your portfolio monitoring now.</p>
                 </div>
                 <SearchCommand 
                    renderAs="button" 
                    label="Explore Market" 
                    initialStocks={initialSearchStocks} 
                  />
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR SECTION ───────────────────────────────────── */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
           <div className="dashboard-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-200">Price Alerts</h3>
                </div>
                <span className="text-xs font-bold text-gray-600 bg-gray-700/50 px-2 py-1 rounded">GLOBAL</span>
              </div>
              <AlertsList alertData={initialAlerts} />
           </div>

           {/* AI Investment Guide (Static Display) */}
           <div className="dashboard-card p-6 bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/20">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <span className="text-lg">🤖</span> AI Portfolio Insight
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Based on your current watchlist of <span className="text-yellow-500 font-bold">{initialWatchlist.length}</span> stocks, 
                your portfolio has a <span className="text-green-400 font-medium">bullish tendency</span> in the short term. 
                Keep an eye on <span className="text-yellow-500 font-bold">{stats.topGainer?.symbol || "AAPL"}</span> for continued momentum.
              </p>
           </div>
        </aside>

      </div>
    </div>
  );
}

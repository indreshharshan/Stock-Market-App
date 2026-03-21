import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import AddAlertButton from "@/components/AddAlertButton";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { getNews } from "@/lib/actions/finnhub.actions";
import Image from "next/image";

async function getIsInWatchlist(userId: string, symbol: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const item = await Watchlist.findOne({ userId, symbol: symbol.toUpperCase() }).lean();
    return !!item;
  } catch {
    return false;
  }
}

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;
  const isInWatchlist = userId ? await getIsInWatchlist(userId, upperSymbol) : false;

  // Fetch company news for "detailed insights"
  const news = await getNews([upperSymbol]);

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8 gap-8">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {upperSymbol} Insights
          </h1>
          <p className="text-sm text-gray-500">Real-time market data & company analysis</p>
        </div>
        
        <div className="flex items-center gap-3">
          <AddAlertButton symbol={upperSymbol} company={upperSymbol} />
          <div className="h-8 w-px bg-gray-700 mx-1" />
          <WatchlistButton
            symbol={upperSymbol}
            company={upperSymbol}
            isInWatchlist={isInWatchlist}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content (Left/Center) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Symbol & Chart */}
          <section className="flex flex-col gap-6">
            <TradingViewWidget
              scriptUrl={`${scriptUrl}symbol-info.js`}
              config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
              height={170}
            />

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Advanced Candlestick Chart</h3>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Live Data
                </span>
              </div>
              <TradingViewWidget
                scriptUrl={`${scriptUrl}advanced-chart.js`}
                config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                className="custom-chart"
                height={550}
              />
            </div>
          </section>

          {/* Company News / Insights */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-100">Latest Company News</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.length > 0 ? (
                news.map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-yellow-500/50 hover:bg-gray-800/50 transition-all duration-300 flex flex-col gap-3"
                  >
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-800">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.headline} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 italic text-sm">No preview available</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-200 line-clamp-2 group-hover:text-yellow-400 transition-colors">{item.headline}</h4>
                      <p className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                        <span>{item.source}</span>
                        <span>{new Date(item.datetime * 1000).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </a>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-gray-900 border border-dashed border-gray-800 rounded-xl text-gray-500">
                  No recent news articles found for this symbol.
                </div>
              )}
            </div>
          </section>

          {/* Baseline Chart */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Historical Baseline Analysis</h3>
            </div>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}advanced-chart.js`}
              config={BASELINE_WIDGET_CONFIG(symbol)}
              className="custom-chart"
              height={500}
            />
          </section>
        </div>

        {/* Sidebar (Right) */}
        <aside className="lg:col-span-4 flex flex-col gap-8">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Technical Analysis</h3>
            </div>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}technical-analysis.js`}
              config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
              height={400}
            />
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-hidden">
             <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Company Profile</h3>
            </div>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}company-profile.js`}
              config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
              height={440}
            />
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-hidden">
             <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Financial Indicators</h3>
            </div>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}financials.js`}
              config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
              height={464}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

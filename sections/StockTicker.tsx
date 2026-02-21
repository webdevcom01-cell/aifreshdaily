"use client"
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TickerRow {
  id: number;
  symbol: string;
  name: string | null;
  change_pct: number;
  type: 'stock' | 'crypto' | 'index';
  updated_at: string | null;
}

const FALLBACK_TICKERS: TickerRow[] = [
  { id: 1, symbol: 'NVDA',     name: 'NVIDIA',         change_pct:  2.34, type: 'stock',  updated_at: null },
  { id: 2, symbol: 'MSFT',     name: 'Microsoft',      change_pct: -0.12, type: 'stock',  updated_at: null },
  { id: 3, symbol: 'GOOGL',    name: 'Alphabet',       change_pct:  1.87, type: 'stock',  updated_at: null },
  { id: 4, symbol: 'META',     name: 'Meta',           change_pct:  0.95, type: 'stock',  updated_at: null },
  { id: 5, symbol: 'AMD',      name: 'AMD',            change_pct:  1.73, type: 'stock',  updated_at: null },
  { id: 6, symbol: 'ORCL',     name: 'Oracle',         change_pct: -0.44, type: 'stock',  updated_at: null },
  { id: 7, symbol: 'PLTR',     name: 'Palantir',       change_pct:  3.21, type: 'stock',  updated_at: null },
  { id: 8, symbol: 'SNOW',     name: 'Snowflake',      change_pct:  4.15, type: 'stock',  updated_at: null },
  { id: 9, symbol: 'AI INDEX', name: 'AI Power Index', change_pct:  1.42, type: 'index',  updated_at: null },
];

const REFRESH_MS = 60_000; // re-fetch every 60 seconds

function timeAgo(isoString: string | null): string {
  if (!isoString) return '';
  const diffMs  = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr  = Math.floor(diffMin / 60);
  if (diffHr  < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function StockTicker() {
  const [tickers,     setTickers]     = useState<TickerRow[]>(FALLBACK_TICKERS);
  const [updatedAt,   setUpdatedAt]   = useState<string | null>(null);
  const [flash,       setFlash]       = useState(false);
  const [usingLive,   setUsingLive]   = useState(false);

  const fetchTickers = useCallback(async () => {
    const { data, error } = await supabase
      .from('stock_tickers')
      .select('id, symbol, name, change_pct, type, updated_at')
      .order('id');

    if (!error && data && data.length > 0) {
      setTickers(data as TickerRow[]);
      setUpdatedAt((data[0] as TickerRow).updated_at);
      setUsingLive(true);
      // Brief flash to signal a data refresh
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
  }, []);

  useEffect(() => {
    fetchTickers(); // initial fetch
    const interval = setInterval(fetchTickers, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchTickers]);

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className={`bg-white dark:bg-ai-space border-b border-gray-200 dark:border-ai-space-medium overflow-hidden transition-colors duration-300 ${flash ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto scrollbar-hide">

          {/* Label + LIVE badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Activity className="w-4 h-4 text-ai-purple dark:text-ai-purple-light" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white font-heading">
              AI Power Index
            </span>
            {/* LIVE pulse indicator */}
            <span className="flex items-center gap-1 ml-1">
              <span className={`relative flex h-2 w-2 ${usingLive ? '' : 'opacity-40'}`}>
                {usingLive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${usingLive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              </span>
              <span className={`text-[10px] font-mono-ai font-bold uppercase tracking-wider ${usingLive ? 'text-emerald-500' : 'text-gray-400'}`}>
                {usingLive ? 'live' : 'static'}
              </span>
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 dark:bg-ai-space-medium flex-shrink-0" />

          {/* Ticker items */}
          <div className="flex items-center gap-5 flex-1">
            {tickers.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1"
              >
                <span className={`text-xs font-semibold uppercase font-mono-ai ${
                  stock.type === 'index'
                    ? 'text-ai-purple dark:text-ai-purple-light'
                    : 'text-gray-900 dark:text-gray-200'
                }`}>
                  {stock.symbol}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-medium font-mono-ai ${
                  stock.change_pct >= 0
                    ? 'text-emerald-600 dark:text-ai-green-light'
                    : 'text-red-600 dark:text-ai-red-light'
                }`}>
                  {stock.change_pct >= 0
                    ? <TrendingUp   className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />
                  }
                  {formatChange(stock.change_pct)}
                </span>
              </div>
            ))}
          </div>

          {/* Updated-ago timestamp */}
          {updatedAt && (
            <span className="hidden sm:block text-[10px] font-mono-ai text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
              {timeAgo(updatedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

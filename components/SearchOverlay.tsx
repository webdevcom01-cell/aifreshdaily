"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase, fetchPopularTags } from '@/lib/supabase';
import type { Article } from '@/types';

// ── Local-storage helpers ──────────────────────────────────────────────────
const RECENT_KEY = 'ai-freshdaily-recent-searches';

function getRecentSearches(): string[] {
  try {
    const s = localStorage.getItem(RECENT_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function saveRecentSearch(q: string) {
  const updated = [q, ...getRecentSearches().filter((s) => s !== q)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

// ── Trending tags cache (module-level, refreshed once per session) ─────────
let trendingCache: { tag: string; count: number }[] | null = null;

async function getTrending() {
  if (trendingCache) return trendingCache;
  trendingCache = await fetchPopularTags(8);
  return trendingCache;
}

// ── Format tag label: "openai" → "OpenAI", "gpt-4o" → "GPT-4o" ──────────
// "claude-3-5-sonnet" → "Claude-3-5-Sonnet" (once in version region, hyphens persist)
function fmtTag(tag: string): string {
  const upper = ['openai', 'gpt', 'llm', 'ai', 'api', 'agi', 'gpu', 'tpu', 'llms', 'rlhf'];
  const parts = tag.split('-');
  let inVersion = false;
  return parts.reduce((acc, w, i) => {
    const fmt = upper.includes(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1);
    if (i === 0) return fmt;
    if (/^\d/.test(w)) inVersion = true;
    const sep = inVersion ? '-' : ' ';
    return acc + sep + fmt;
  }, '');
}

// ── Types ─────────────────────────────────────────────────────────────────
interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ArticleRow {
  id: string;
  headline: string;
  excerpt: string | null;
  image: string | null;
  category: string;
  read_time: string | null;
  tags: string[] | null;
}

// ── Component ─────────────────────────────────────────────────────────────
export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState<ArticleRow[]>([]);
  const [trending, setTrending]         = useState<{ tag: string; count: number }[]>([]);
  const [recentSearches]                = useState<string[]>(getRecentSearches);
  const [isSearching, setIsSearching]   = useState(false);
  const [hasSearched, setHasSearched]   = useState(false);
  const inputRef                        = useRef<HTMLInputElement>(null);
  const debounceRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router                          = useRouter();

  // Load trending tags once when overlay opens
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setTimeout(() => inputRef.current?.focus(), 100);
    getTrending().then(setTrending);
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (isOpen) onClose(); }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Supabase full-text search with 300ms debounce
  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setHasSearched(false); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);

      // 1) Try full-text search on headline first (fast + ranked)
      const { data: ftData } = await supabase
        .from('articles')
        .select('id, headline, excerpt, image, category, read_time, tags')
        .textSearch('headline', q, { type: 'websearch', config: 'english' })
        .limit(8);

      if (ftData && ftData.length > 0) {
        setResults(ftData as ArticleRow[]);
        setIsSearching(false);
        return;
      }

      // 2) Fallback: ilike across headline + excerpt, plus exact tag match
      const tagSlug = q.toLowerCase().trim().replace(/\s+/g, '-');
      const { data: likeData } = await supabase
        .from('articles')
        .select('id, headline, excerpt, image, category, read_time, tags')
        .or(`headline.ilike.%${q}%,excerpt.ilike.%${q}%,tags.cs.{${tagSlug}}`)
        .limit(8);

      setResults((likeData ?? []) as ArticleRow[]);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleSelect = useCallback((id: string) => {
    if (query.trim()) saveRecentSearch(query.trim());
    onClose();
    router.push(`/article/${id}`);
  }, [query, onClose, router]);

  const handleTrendingClick = (tag: string) => {
    setQuery(fmtTag(tag));
    doSearch(fmtTag(tag));
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="absolute top-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-ai-space shadow-2xl animate-in slide-in-from-top-2 duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

          {/* Search Input */}
          <form onSubmit={(e) => { e.preventDefault(); if (results.length > 0) handleSelect(results[0].id); }}>
            <div className="relative">
              {isSearching
                ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
                : <Search  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              }
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
                placeholder="Search AI news, topics, models..."
                className="w-full pl-12 pr-24 py-4 text-lg bg-card text-foreground border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors font-heading"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono-ai text-muted-foreground bg-secondary rounded border border-border">ESC</kbd>
                <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </form>

          {/* Search Results */}
          {hasQuery && results.length > 0 && !isSearching && (
            <div className="mt-4 max-h-[50vh] overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {results.map((article) => (
                  <button key={article.id} onClick={() => handleSelect(article.id)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors group text-left">
                    {article.image && (
                      <img src={article.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-heading font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {article.headline}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">{article.category}</span>
                        {article.read_time && <span className="text-xs text-muted-foreground">· {article.read_time}</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {hasQuery && hasSearched && results.length === 0 && !isSearching && (
            <div className="mt-6 text-center py-8">
              <p className="text-muted-foreground">
                No articles found for &ldquo;<span className="font-semibold text-foreground">{query}</span>&rdquo;
              </p>
            </div>
          )}

          {/* Trending + Recent (when no query) */}
          {!hasQuery && (
            <div className="mt-6 space-y-6 max-h-[50vh] overflow-y-auto">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Recent Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s) => (
                      <button key={s}
                        onClick={() => { setQuery(s); doSearch(s); inputRef.current?.focus(); }}
                        className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm text-foreground transition-colors border border-border">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Topics — real data from DB */}
              {trending.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Trending Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trending.map((t, i) => (
                      <button key={t.tag} onClick={() => handleTrendingClick(t.tag)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm text-foreground transition-colors border border-border hover:border-primary/20">
                        {i < 4 && <span className="text-orange-500 text-xs">🔥</span>}
                        {fmtTag(t.tag)}
                        <span className="text-xs text-muted-foreground">{t.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyboard hint */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Keyboard Shortcut</p>
                <p className="text-sm text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-secondary rounded border border-border font-mono-ai text-xs">⌘K</kbd> anytime to open search
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

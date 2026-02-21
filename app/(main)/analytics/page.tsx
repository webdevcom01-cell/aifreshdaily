import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { BarChart2, Eye, FileText, Tag, Trophy, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Site Analytics | AI Fresh Daily',
  description: 'Real-time content performance stats for AI Fresh Daily.',
};

export const revalidate = 300; // revalidate every 5 minutes

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtTag(tag: string): string {
  const upper = ['openai', 'gpt', 'llm', 'ai', 'api', 'agi', 'gpu'];
  return tag
    .split('-')
    .map((w) => (upper.includes(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

// ── Types ─────────────────────────────────────────────────────────────────
interface ArticleSummary  { category: string; view_count: number | null }
interface ArticleTop      { id: string; headline: string; category: string; view_count: number | null }
interface TagRow          { tags: string[] | null }
interface ModelRow        { name: string; company: string; vote_count: number | null }
interface StatsRow        { total_subscribers: number }

// ── Page ──────────────────────────────────────────────────────────────────
export default async function AnalyticsPage() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Fetch newsletter stats separately so a missing RPC doesn't crash the page
  let totalSubs = 0;
  try {
    const { data } = await sb.rpc('get_newsletter_stats');
    const row = Array.isArray(data) ? (data as StatsRow[])[0] : (data as StatsRow | null);
    totalSubs = Number(row?.total_subscribers ?? 0);
  } catch { /* RPC not yet deployed — show 0 */ }

  const [
    { data: articleRows },
    { data: topArticles },
    { data: tagRows },
    { data: models },
  ] = await Promise.all([
    sb.from('articles').select('category, view_count'),
    sb.from('articles')
      .select('id, headline, category, view_count')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(10),
    sb.from('articles').select('tags').not('tags', 'is', null).limit(500),
    sb.from('model_scores')
      .select('name, company, vote_count')
      .order('vote_count', { ascending: false }),
  ]);

  // ── Aggregate ─────────────────────────────────────────────────────────
  const articles    = (articleRows ?? []) as ArticleSummary[];
  const totalArts   = articles.length;
  const totalViews  = articles.reduce((s, a) => s + (a.view_count ?? 0), 0);

  // Category breakdown
  const catCounts: Record<string, number> = {};
  articles.forEach((a) => { catCounts[a.category] = (catCounts[a.category] ?? 0) + 1; });
  const categories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const maxCat     = categories[0]?.[1] ?? 1;

  // Tag frequency
  const tagFreq: Record<string, number> = {};
  (tagRows as TagRow[] ?? []).forEach((r) =>
    (r.tags ?? []).forEach((t) => { tagFreq[t] = (tagFreq[t] ?? 0) + 1; }),
  );
  const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 15);

  const top       = (topArticles ?? []) as ArticleTop[];
  const maxViews  = top[0]?.view_count ?? 1;
  const modelList = (models ?? []) as ModelRow[];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2 ai-gradient-bg rounded-lg">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-heading text-gray-900 dark:text-white">
            Site Analytics
          </h1>
          <p className="text-sm text-muted-foreground font-mono-ai">
            Live content performance — updates every 5 min
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {([
          { icon: <FileText className="w-5 h-5" />, label: 'Total Articles', value: fmtNum(totalArts),  color: 'text-ai-purple'    },
          { icon: <Eye      className="w-5 h-5" />, label: 'Total Views',    value: fmtNum(totalViews), color: 'text-blue-500'     },
          { icon: <Users    className="w-5 h-5" />, label: 'Subscribers',    value: totalSubs > 0 ? fmtNum(totalSubs) : '—', color: 'text-emerald-500' },
          { icon: <Trophy   className="w-5 h-5" />, label: 'Models Ranked',  value: fmtNum(modelList.length), color: 'text-amber-500' },
        ] as const).map(({ icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className={`mb-2 ${color}`}>{icon}</div>
            <p className="text-2xl font-black font-heading text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground font-mono-ai uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* Top Articles by Views */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold font-heading text-foreground mb-4">
            <Eye className="w-4 h-4 text-blue-500" /> Top Articles by Views
          </h2>
          <div className="space-y-2">
            {top.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No views recorded yet.</p>
            )}
            {top.map((a, i) => {
              const pct = maxViews > 0 ? ((a.view_count ?? 0) / maxViews) * 100 : 0;
              return (
                <a key={a.id} href={`/article/${a.id}`}
                  className="block p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/40 transition-colors group">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono-ai font-bold text-muted-foreground w-5 flex-shrink-0 pt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {a.headline}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono-ai">
                          {a.category}
                        </span>
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full ai-gradient-bg rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                        <span className="text-xs font-mono-ai font-bold text-muted-foreground w-6 text-right">
                          {a.view_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <div className="space-y-8">

          {/* Articles by Category */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold font-heading text-foreground mb-4">
              <BarChart2 className="w-4 h-4 text-ai-purple" /> Articles by Category
            </h2>
            <div className="space-y-2">
              {categories.map(([cat, count]) => (
                <a key={cat} href={`/category/${cat}`} className="flex items-center gap-3 group">
                  <span className="text-xs font-mono-ai font-bold uppercase tracking-wider text-muted-foreground w-16 flex-shrink-0 text-right group-hover:text-primary transition-colors">
                    {cat}
                  </span>
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full ai-gradient-bg rounded-full" style={{ width: `${(count / maxCat) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono-ai font-bold text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* Top Tags */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold font-heading text-foreground mb-4">
              <Tag className="w-4 h-4 text-blue-500" /> Top Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <a key={tag} href={`/tag/${tag}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/60 border border-border hover:border-primary/30 rounded-lg text-sm transition-colors group">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {fmtTag(tag)}
                  </span>
                  <span className="text-xs font-mono-ai text-muted-foreground">{count}</span>
                </a>
              ))}
            </div>
          </section>

          {/* Model Vote Rankings */}
          {modelList.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold font-heading text-foreground mb-4">
                <Trophy className="w-4 h-4 text-amber-500" /> Community Model Votes
              </h2>
              <div className="space-y-1.5">
                {modelList.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <span className="text-xs font-mono-ai text-muted-foreground w-4">{i + 1}</span>
                    <span className="flex-1 text-sm font-semibold text-foreground truncate">{m.name}</span>
                    <span className="text-xs font-mono-ai text-muted-foreground">{m.company}</span>
                    <span className="text-xs font-mono-ai font-bold text-ai-purple w-8 text-right">
                      {m.vote_count ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
}

import { createClient } from '@supabase/supabase-js';
import type { Article, ArticleSource, TimelineEvent, AIVoice } from '@/types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ArticleRow {
  id: string;
  headline: string;
  excerpt: string | null;
  summary: string | null;
  image: string | null;
  category: string;
  author: string | null;
  read_time: string | null;
  published_at: string | null;
  original_url: string | null;
  is_exclusive: boolean;
  is_featured: boolean;
  is_breaking: boolean;
  source_name: string | null;
  source_url: string | null;
  source_favicon: string | null;
  key_points: string[] | null;
  why_it_matters: string | null;
  tags: string[] | null;
  body: string | null;
  word_count: number | null;
}

function mapRow(row: ArticleRow): Article {
  const source: ArticleSource | undefined =
    row.source_name
      ? { name: row.source_name, url: row.source_url ?? '', favicon: row.source_favicon ?? undefined }
      : undefined;

  return {
    id: row.id,
    headline: row.headline,
    excerpt: row.excerpt ?? undefined,
    summary: row.summary ?? undefined,
    image: row.image ?? '',
    category: row.category,
    author: row.author ?? undefined,
    readTime: row.read_time ?? '3 min read',
    publishedAt: row.published_at
      ? new Date(row.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : undefined,
    originalUrl: row.original_url ?? undefined,
    isExclusive: row.is_exclusive,
    isFeatured: row.is_featured,
    isBreaking: row.is_breaking,
    source,
    tags: row.tags ?? undefined,
    keyPoints: row.key_points ?? undefined,
    whyItMatters: row.why_it_matters ?? undefined,
    body: row.body ?? undefined,
  };
}

export async function fetchArticles(limit = 20): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ArticleRow[]).map(mapRow);
}

export async function fetchByCategory(category: string, limit = 20): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ArticleRow[]).map(mapRow);
}

export async function fetchVideoArticles(limit = 6): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_video', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ArticleRow[]).map(mapRow);
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return mapRow(data as ArticleRow);
}

export async function fetchFeatured(limit = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ArticleRow[]).map(mapRow);
}

export async function fetchHeroArticles(limit = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .not('image', 'is', null)
    .neq('image', '')
    .or('is_featured.eq.true,is_breaking.eq.true,is_exclusive.eq.true')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data as ArticleRow[]).map(mapRow);
}

interface TimelineEventRow {
  id: number;
  year: string;
  quarter: string | null;
  title: string;
  description: string | null;
  type: 'past' | 'present' | 'future';
  sort_order: number;
}

export async function fetchTimelineEvents(): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as TimelineEventRow[]).map((row) => ({
    year: row.year,
    quarter: row.quarter ?? undefined,
    title: row.title,
    description: row.description ?? '',
    type: row.type,
  }));
}

interface AIVoiceRow {
  id: number;
  name: string;
  title: string | null;
  company: string | null;
  avatar: string | null;
  quote: string;
  article_link: string | null;
  sort_order: number;
}

export async function fetchAIVoices(): Promise<AIVoice[]> {
  const { data, error } = await supabase
    .from('ai_voices')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as AIVoiceRow[]).map((row) => ({
    name: row.name,
    title: row.title ?? '',
    company: row.company ?? '',
    avatar: row.avatar ?? '',
    quote: row.quote,
    articleLink: row.article_link ?? undefined,
  }));
}

export async function fetchBreaking(limit = 5): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_breaking', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ArticleRow[]).map(mapRow);
}

export async function fetchAllArticleIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('id')
    .order('published_at', { ascending: false });
  if (error) return [];
  return (data as { id: string }[]).map((row) => row.id);
}

export async function fetchByTag(tag: string, limit = 30): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .contains('tags', [tag])
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ArticleRow[]).map(mapRow);
}

export async function fetchPopularTags(limit = 20): Promise<{ tag: string; count: number }[]> {
  // Fetch recent articles and count tag frequency client-side
  const { data, error } = await supabase
    .from('articles')
    .select('tags')
    .not('tags', 'is', null)
    .order('published_at', { ascending: false })
    .limit(200);
  if (error) return [];
  const freq: Record<string, number> = {};
  for (const row of data as { tags: string[] | null }[]) {
    for (const t of row.tags ?? []) {
      freq[t] = (freq[t] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

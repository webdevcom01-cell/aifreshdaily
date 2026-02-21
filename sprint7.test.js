/**
 * Sprint 7 Test Suite — AI Fresh Daily
 * Tests: StockTicker auto-refresh, Newsletter stats, Analytics page
 *
 * Run: node sprint7.test.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = 'https://kcqfaghyixwfewyudcgb.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjcWZhZ2h5aXh3ZmV3eXVkY2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjUxMzIsImV4cCI6MjA4Njk0MTEzMn0.Rxz1tdAPdpzJnTNyXYgJpAiYVkEwcyjn5e8fxzrLTEk';
const PROJECT      = '/Users/buda007/aifreshdaily-next';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ── Test runner ───────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try {
    const r = fn();
    if (r instanceof Promise) {
      return r
        .then(() => { console.log(`  ✅ ${name}`); passed++; })
        .catch((e) => { console.log(`  ❌ ${name}\n     ${e.message}`); failed++; });
    }
    console.log(`  ✅ ${name}`); passed++;
  } catch (e) {
    console.log(`  ❌ ${name}\n     ${e.message}`); failed++;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg ?? 'assertion failed'); }
function readSrc(rel) { return readFileSync(resolve(PROJECT, rel), 'utf-8'); }

// ─────────────────────────────────────────────────────────────────────────
// GROUP 1 — 7.1 StockTicker: auto-refresh code
// ─────────────────────────────────────────────────────────────────────────
console.log('\n📈  Group 1 — 7.1 StockTicker: auto-refresh code');

test('StockTicker defines REFRESH_MS constant (≤ 60 000)', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('REFRESH_MS'), 'REFRESH_MS constant missing');
  const match = src.match(/REFRESH_MS\s*=\s*(\d+)/);
  assert(match && parseInt(match[1]) <= 60_000, 'REFRESH_MS should be ≤ 60 000 ms');
});

test('StockTicker uses setInterval with REFRESH_MS', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('setInterval'), 'setInterval missing');
  assert(src.includes('REFRESH_MS'), 'REFRESH_MS not passed to setInterval');
});

test('StockTicker clears interval on unmount (clearInterval)', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('clearInterval'), 'clearInterval cleanup missing — memory leak!');
});

test('StockTicker fetches updated_at from DB', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('updated_at'), 'updated_at not selected from stock_tickers');
});

test('timeAgo helper converts ISO string to human label', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('timeAgo'), 'timeAgo helper not defined');
  assert(src.includes('just now') || src.includes('diffMin'), 'timeAgo logic missing');
});

test('LIVE pulsing indicator is rendered', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('animate-ping'), 'animate-ping pulse effect missing');
  assert(src.includes('live') || src.includes('LIVE'), 'LIVE label missing');
});

test('flash state briefly changes background on data refresh', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('flash'), 'flash state variable missing');
  assert(src.includes('setFlash'), 'setFlash not called');
});

test('usingLive state distinguishes fallback from DB data', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('usingLive'), 'usingLive state missing');
  assert(src.includes('setUsingLive'), 'setUsingLive not called');
});

test('updated_at timestamp is shown in the UI', () => {
  const src = readSrc('sections/StockTicker.tsx');
  assert(src.includes('updatedAt') && src.includes('timeAgo'), 'updated-ago display missing from UI');
});

// ─────────────────────────────────────────────────────────────────────────
// GROUP 2 — 7.1 StockTicker: live DB
// ─────────────────────────────────────────────────────────────────────────
console.log('\n🌐  Group 2 — 7.1 StockTicker: live DB');

test('stock_tickers has updated_at column', async () => {
  const { data, error } = await supabase
    .from('stock_tickers')
    .select('id, symbol, updated_at')
    .limit(1);
  assert(!error, `DB error: ${error?.message}`);
  assert(data?.[0]?.updated_at !== undefined, 'updated_at column missing from stock_tickers');
});

test('all 9 stock_tickers rows are readable', async () => {
  const { data, error } = await supabase
    .from('stock_tickers')
    .select('id, symbol, change_pct, updated_at')
    .order('id');
  assert(!error, `DB error: ${error?.message}`);
  assert(data?.length === 9, `expected 9 rows, got ${data?.length}`);
});

// ─────────────────────────────────────────────────────────────────────────
// GROUP 3 — 7.2 Newsletter: code
// ─────────────────────────────────────────────────────────────────────────
console.log('\n📧  Group 3 — 7.2 Newsletter: code');

test('supabase.ts exports fetchNewsletterStats', () => {
  const src = readSrc('lib/supabase.ts');
  assert(src.includes('export async function fetchNewsletterStats'), 'fetchNewsletterStats not exported');
});

test('fetchNewsletterStats calls get_newsletter_stats RPC', () => {
  const src = readSrc('lib/supabase.ts');
  assert(src.includes("rpc('get_newsletter_stats')"), 'get_newsletter_stats RPC call missing');
});

test('fetchNewsletterStats returns { total: 0 } on error (safe fallback)', () => {
  const src = readSrc('lib/supabase.ts');
  const fn = src.split('fetchNewsletterStats')[1]?.split('export')[0] ?? '';
  assert(fn.includes('total: 0'), 'missing { total: 0 } fallback');
});

test('NewsletterSection imports fetchNewsletterStats', () => {
  const src = readSrc('sections/NewsletterSection.tsx');
  assert(src.includes('fetchNewsletterStats'), 'fetchNewsletterStats not imported');
});

test('NewsletterSection imports Users icon from lucide-react', () => {
  const src = readSrc('sections/NewsletterSection.tsx');
  assert(src.includes('Users'), 'Users icon not imported');
});

test('NewsletterSection displays subscriber count when > 0', () => {
  const src = readSrc('sections/NewsletterSection.tsx');
  assert(src.includes('subCount') && src.includes('formattedCount'), 'subscriber count display logic missing');
});

test('NewsletterSection optimistically increments count on subscribe', () => {
  const src = readSrc('sections/NewsletterSection.tsx');
  assert(src.includes('prev + 1'), 'optimistic increment missing');
});

test('sprint7_migrations.sql exists', () => {
  assert(existsSync(resolve(PROJECT, 'sprint7_migrations.sql')), 'migration file not found');
});

test('migration creates newsletter_subscribers table', () => {
  const sql = readSrc('sprint7_migrations.sql');
  assert(sql.includes('newsletter_subscribers'), 'newsletter_subscribers table missing');
  assert(sql.includes('create table if not exists'), 'idempotent CREATE TABLE missing');
});

test('migration creates get_newsletter_stats SECURITY DEFINER function', () => {
  const sql = readSrc('sprint7_migrations.sql');
  assert(sql.includes('get_newsletter_stats'), 'get_newsletter_stats function missing');
  assert(sql.toLowerCase().includes('security definer'), 'SECURITY DEFINER missing');
});

test('migration enables RLS on newsletter_subscribers', () => {
  const sql = readSrc('sprint7_migrations.sql');
  assert(sql.includes('enable row level security'), 'RLS not enabled on newsletter_subscribers');
});

// ─────────────────────────────────────────────────────────────────────────
// GROUP 4 — 7.3 Analytics page: file & code
// ─────────────────────────────────────────────────────────────────────────
console.log('\n📊  Group 4 — 7.3 Analytics page: file & code');

test('app/(main)/analytics/page.tsx exists', () => {
  assert(existsSync(resolve(PROJECT, 'app/(main)/analytics/page.tsx')), 'analytics page not found');
});

test('analytics page exports revalidate = 300 (5 min ISR)', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(src.includes('revalidate = 300'), 'revalidate = 300 missing (5 min ISR)');
});

test('analytics page is a Server Component (no "use client")', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(!src.startsWith('"use client"') && !src.startsWith("'use client'"), 'should be a Server Component');
});

test('analytics page shows total articles stat', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(src.includes('totalArts') || src.includes('Total Articles'), 'total articles stat missing');
});

test('analytics page shows total views stat', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(src.includes('totalViews') || src.includes('Total Views'), 'total views stat missing');
});

test('analytics page shows top articles by view_count', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(src.includes('view_count') && src.includes('Top Articles'), 'top articles section missing');
});

test('analytics page shows category breakdown', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(src.includes('catCounts') || src.includes('by Category'), 'category breakdown missing');
});

test('analytics page shows top tags', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(src.includes('topTags') && src.includes('Top Tags'), 'top tags section missing');
});

test('analytics page shows model vote rankings', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(src.includes('vote_count') && src.includes('Model Votes'), 'model votes section missing');
});

test('analytics page links to /article/:id, /category/:cat, /tag/:tag', () => {
  const src = readSrc('app/(main)/analytics/page.tsx');
  assert(src.includes('/article/'), 'missing /article/ links');
  assert(src.includes('/category/'), 'missing /category/ links');
  assert(src.includes('/tag/'), 'missing /tag/ links');
});

test('Footer includes /analytics link', () => {
  const src = readSrc('sections/Footer.tsx');
  assert(src.includes('href="/analytics"'), 'analytics link missing from Footer');
});

// ─────────────────────────────────────────────────────────────────────────
// GROUP 5 — 7.3 Analytics: live DB queries
// ─────────────────────────────────────────────────────────────────────────
console.log('\n🌐  Group 5 — 7.3 Analytics: live DB queries');

test('articles query for analytics returns data', async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('category, view_count');
  assert(!error, `DB error: ${error?.message}`);
  assert(data && data.length > 0, 'no articles found');
});

test('top-articles query (order by view_count DESC) works', async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('id, headline, category, view_count')
    .order('view_count', { ascending: false, nullsFirst: false })
    .limit(10);
  assert(!error, `DB error: ${error?.message}`);
  assert(data && data.length > 0, 'no top articles returned');
  // Results should be sorted descending
  if (data.length > 1) {
    const first  = data[0].view_count ?? 0;
    const second = data[1].view_count ?? 0;
    assert(first >= second, 'view_count not sorted DESC');
  }
});

test('model_scores query for analytics returns rows with vote_count', async () => {
  const { data, error } = await supabase
    .from('model_scores')
    .select('name, company, vote_count')
    .order('vote_count', { ascending: false });
  assert(!error, `DB error: ${error?.message}`);
  assert(data && data.length > 0, 'no model rows returned');
  assert('vote_count' in data[0], 'vote_count missing from model_scores');
});

test('tags frequency aggregation works (articles.tags array)', async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('tags')
    .not('tags', 'is', null)
    .limit(50);
  assert(!error, `DB error: ${error?.message}`);
  const freq = {};
  (data ?? []).forEach(r => (r.tags ?? []).forEach(t => { freq[t] = (freq[t] ?? 0) + 1; }));
  const topTags = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  assert(topTags.length > 0, 'no tags found for frequency analysis');
});

// ─────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────
setTimeout(async () => {
  await new Promise(r => setTimeout(r, 3000));
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Sprint 7 Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('🎉 All Sprint 7 tests passed!');
  else console.log('⚠️  Some tests failed — check above for details.');
  process.exit(failed > 0 ? 1 : 0);
}, 100);

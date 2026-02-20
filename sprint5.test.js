/**
 * Sprint 5 Test Suite — AI Fresh Daily
 * Tests: RSS Feed, SearchOverlay, Article Body \n→<br>, keyPoints/whyItMatters
 *
 * Run: node sprint5.test.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL  = 'https://kcqfaghyixwfewyudcgb.supabase.co';
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjcWZhZ2h5aXh3ZmV3eXVkY2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjUxMzIsImV4cCI6MjA4Njk0MTEzMn0.Rxz1tdAPdpzJnTNyXYgJpAiYVkEwcyjn5e8fxzrLTEk';
const PROJECT       = '/Users/buda007/aifreshdaily-next';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ── Test runner ────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => { console.log(`  ✅ ${name}`); passed++; })
                   .catch((e) => { console.log(`  ❌ ${name}\n     ${e.message}`); failed++; });
    }
    console.log(`  ✅ ${name}`); passed++;
  } catch (e) {
    console.log(`  ❌ ${name}\n     ${e.message}`); failed++;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg ?? 'assertion failed'); }
function readSrc(relPath) {
  return readFileSync(resolve(PROJECT, relPath), 'utf-8');
}

// ──────────────────────────────────────────────────────────────────────────
// GROUP 1 — 5.1 RSS Feed: file & structure
// ──────────────────────────────────────────────────────────────────────────
console.log('\n📡  Group 1 — 5.1 RSS Feed: file & structure');

test('feed.xml/route.ts exists', () => {
  assert(existsSync(resolve(PROJECT, 'app/feed.xml/route.ts')), 'file not found');
});

test('route exports GET function', () => {
  const src = readSrc('app/feed.xml/route.ts');
  assert(src.includes('export async function GET'), 'no GET export');
});

test('route returns NextResponse with XML content-type', () => {
  const src = readSrc('app/feed.xml/route.ts');
  assert(src.includes('application/xml'), 'missing application/xml content-type');
  assert(src.includes('new NextResponse'), 'not using NextResponse');
});

test('route builds RSS 2.0 structure', () => {
  const src = readSrc('app/feed.xml/route.ts');
  assert(src.includes('version="2.0"'), 'missing RSS version 2.0');
  assert(src.includes('<channel>'), 'missing <channel>');
  assert(src.includes('<item>'), 'missing <item>');
  assert(src.includes('atom:link'), 'missing atom:link self-reference');
});

test('route uses escapeXml to sanitise headline/excerpt', () => {
  const src = readSrc('app/feed.xml/route.ts');
  assert(src.includes('escapeXml'), 'missing escapeXml helper');
  assert(src.includes('replace(/&/g'), 'escapeXml must escape ampersands');
});

test('route fetches last 50 articles ordered by published_at DESC', () => {
  const src = readSrc('app/feed.xml/route.ts');
  assert(src.includes('.limit(50)'), 'should limit to 50 articles');
  assert(src.includes("ascending: false"), 'should order newest first');
});

test('route includes Cache-Control header for CDN caching', () => {
  const src = readSrc('app/feed.xml/route.ts');
  assert(src.includes('Cache-Control'), 'missing Cache-Control header');
  assert(src.includes('max-age=3600') || src.includes('s-maxage'), 'should cache for at least 1 h');
});

test('route sets <ttl> to 60 minutes', () => {
  const src = readSrc('app/feed.xml/route.ts');
  assert(src.includes('<ttl>60</ttl>'), 'missing <ttl>60</ttl>');
});

test('route includes enclosure tag for article images', () => {
  const src = readSrc('app/feed.xml/route.ts');
  assert(src.includes('enclosure'), 'missing enclosure for images');
});

// ──────────────────────────────────────────────────────────────────────────
// GROUP 2 — 5.1 RSS Feed: live DB fetch
// ──────────────────────────────────────────────────────────────────────────
console.log('\n🌐  Group 2 — 5.1 RSS Feed: live DB fetch');

test('can fetch 50 articles from Supabase for RSS', async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('id, headline, excerpt, category, published_at, tags, image')
    .order('published_at', { ascending: false })
    .limit(50);
  assert(!error, `Supabase error: ${error?.message}`);
  assert(data && data.length > 0, 'no articles returned');
  assert(data.length <= 50, 'returned more than 50 articles');
});

test('all RSS articles have required fields: id + headline', async () => {
  const { data } = await supabase
    .from('articles')
    .select('id, headline')
    .limit(10);
  for (const row of data ?? []) {
    assert(row.id, `article missing id`);
    assert(row.headline, `article ${row.id} missing headline`);
  }
});

test('published_at is parseable as a valid Date for pubDate', async () => {
  const { data } = await supabase
    .from('articles')
    .select('published_at')
    .not('published_at', 'is', null)
    .limit(5);
  for (const row of data ?? []) {
    const d = new Date(row.published_at);
    assert(!isNaN(d.getTime()), `invalid date: ${row.published_at}`);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// GROUP 3 — 5.2 SearchOverlay: extended search
// ──────────────────────────────────────────────────────────────────────────
console.log('\n🔍  Group 3 — 5.2 SearchOverlay: extended search code');

test('doSearch fallback uses .or() for multi-column search', () => {
  const src = readSrc('components/SearchOverlay.tsx');
  assert(src.includes('.or('), 'missing .or() call in doSearch fallback');
});

test('doSearch fallback includes excerpt in ilike search', () => {
  const src = readSrc('components/SearchOverlay.tsx');
  assert(src.includes('excerpt.ilike'), 'excerpt not included in fallback search');
});

test('doSearch fallback includes tags contains search', () => {
  const src = readSrc('components/SearchOverlay.tsx');
  assert(src.includes('tags.cs.'), 'tags.cs (array contains) not in fallback search');
});

test('tag slug normalises query (spaces → hyphens) for tag matching', () => {
  const src = readSrc('components/SearchOverlay.tsx');
  assert(src.includes("replace(/\\s+/g, '-')"), 'missing tag slug normalisation');
});

test('FTS primary search on headline is still present', () => {
  const src = readSrc('components/SearchOverlay.tsx');
  assert(src.includes(".textSearch('headline'"), 'FTS on headline must remain as primary strategy');
});

// ──────────────────────────────────────────────────────────────────────────
// GROUP 4 — 5.2 SearchOverlay: live DB search
// ──────────────────────────────────────────────────────────────────────────
console.log('\n🌐  Group 4 — 5.2 SearchOverlay: live DB extended search');

test('ilike excerpt search returns results', async () => {
  // Get an article with an excerpt, pick first word
  const { data: sample } = await supabase
    .from('articles')
    .select('excerpt')
    .not('excerpt', 'is', null)
    .limit(1);
  const firstWord = sample?.[0]?.excerpt?.split(' ')[0];
  if (!firstWord || firstWord.length < 3) return; // skip if no useful word
  const { data, error } = await supabase
    .from('articles')
    .select('id, headline, excerpt')
    .or(`headline.ilike.%${firstWord}%,excerpt.ilike.%${firstWord}%`)
    .limit(5);
  assert(!error, `Supabase error: ${error?.message}`);
  assert(data && data.length > 0, `no results for excerpt ilike "${firstWord}"`);
});

test('tags.cs search finds articles by exact tag', async () => {
  // Find a tag that exists, then search for articles with it
  const { data: tagSample } = await supabase
    .from('articles')
    .select('tags')
    .not('tags', 'is', null)
    .limit(5);
  const firstTag = tagSample?.find(r => r.tags?.length > 0)?.tags?.[0];
  if (!firstTag) return; // no tagged articles to test with
  const { data, error } = await supabase
    .from('articles')
    .select('id, headline, tags')
    .contains('tags', [firstTag])
    .limit(5);
  assert(!error, `Supabase error: ${error?.message}`);
  assert(data && data.length > 0, `no articles found for tag "${firstTag}"`);
  assert(data[0].tags?.includes(firstTag), `result doesn't contain the searched tag`);
});

// ──────────────────────────────────────────────────────────────────────────
// GROUP 5 — 5.3 Article body \n → <br>
// ──────────────────────────────────────────────────────────────────────────
console.log('\n📄  Group 5 — 5.3 Article body \\n → <br>');

test('ArticleClient imports Fragment from react', () => {
  const src = readSrc('app/(main)/article/[id]/ArticleClient.tsx');
  assert(src.includes('Fragment'), 'Fragment not imported from react');
});

test('body paragraphs are split by single \\n with Fragment + <br>', () => {
  const src = readSrc('app/(main)/article/[id]/ArticleClient.tsx');
  assert(src.includes("para.split('\\n')"), "missing para.split('\\n') for inner newlines");
  assert(src.includes('<Fragment'), 'missing <Fragment> wrapper for br');
  assert(src.includes('<br />'), 'missing <br /> element for line breaks');
});

test('outer paragraph split still uses \\n\\n for paragraph boundaries', () => {
  const src = readSrc('app/(main)/article/[id]/ArticleClient.tsx');
  assert(src.includes("split('\\n\\n')"), "must still split paragraphs on double newline");
});

test('br is only inserted between lines (not after last line)', () => {
  const src = readSrc('app/(main)/article/[id]/ArticleClient.tsx');
  // Should have: j < arr.length - 1 guard
  assert(src.includes('arr.length - 1'), 'missing j < arr.length - 1 guard to skip trailing <br>');
});

// ──────────────────────────────────────────────────────────────────────────
// GROUP 6 — 5.4 keyPoints + whyItMatters alongside body
// ──────────────────────────────────────────────────────────────────────────
console.log('\n💡  Group 6 — 5.4 keyPoints/whyItMatters alongside body');

test('keyPoints section no longer has !article.body guard', () => {
  const src = readSrc('app/(main)/article/[id]/ArticleClient.tsx');
  // The old guard was: !article.body && keyPoints.length > 0
  assert(!src.includes('!article.body && keyPoints'), '!article.body guard still present on keyPoints');
});

test('keyPoints section renders when keyPoints.length > 0', () => {
  const src = readSrc('app/(main)/article/[id]/ArticleClient.tsx');
  assert(src.includes('keyPoints.length > 0'), 'keyPoints.length > 0 condition missing');
});

test('whyItMatters section renders based only on article.whyItMatters presence', () => {
  const src = readSrc('app/(main)/article/[id]/ArticleClient.tsx');
  assert(src.includes('article.whyItMatters &&'), 'whyItMatters conditional missing');
  // Confirm there is no body guard on whyItMatters
  const witSection = src.split('Why It Matters')[1]?.split('Tags')[0] ?? '';
  assert(!witSection.includes('!article.body'), 'whyItMatters should not have body guard');
});

test('keyPoints and whyItMatters both appear AFTER the body block', () => {
  const src = readSrc('app/(main)/article/[id]/ArticleClient.tsx');
  const bodyIdx = src.indexOf('Full Article Body');
  const kpIdx   = src.indexOf('Key Points');
  const witIdx  = src.indexOf('Why It Matters');
  assert(bodyIdx < kpIdx,  'Key Points must appear after Full Article Body');
  assert(bodyIdx < witIdx, 'Why It Matters must appear after Full Article Body');
});

// ──────────────────────────────────────────────────────────────────────────
// GROUP 7 — Live DB: articles with keyPoints/whyItMatters
// ──────────────────────────────────────────────────────────────────────────
console.log('\n🌐  Group 7 — Live DB: keyPoints/whyItMatters data');

test('at least some articles have key_points populated', async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('id, key_points')
    .not('key_points', 'is', null)
    .limit(5);
  assert(!error, `Supabase error: ${error?.message}`);
  assert(data && data.length > 0, 'no articles with key_points found');
  const withKp = data.filter(r => Array.isArray(r.key_points) && r.key_points.length > 0);
  assert(withKp.length > 0, 'key_points arrays are empty');
});

test('at least some articles have why_it_matters populated', async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('id, why_it_matters')
    .not('why_it_matters', 'is', null)
    .limit(5);
  assert(!error, `Supabase error: ${error?.message}`);
  assert(data && data.length > 0, 'no articles with why_it_matters found');
});

test('articles that have body ALSO have key_points (data exists for 5.4 to show)', async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('id, body, key_points')
    .not('body', 'is', null)
    .not('key_points', 'is', null)
    .limit(5);
  assert(!error, `Supabase error: ${error?.message}`);
  assert(data && data.length > 0, 'no articles have both body AND key_points — feature has no data to display');
});

// ──────────────────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────────────────
// Collect all async tests, then print summary
const allTests = [];
const origTest = test;
// Wait a tick for all async tests to queue up, then resolve
setTimeout(async () => {
  // Give async tests time to settle
  await new Promise(r => setTimeout(r, 3000));
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Sprint 5 Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('🎉 All Sprint 5 tests passed!');
  else console.log('⚠️  Some tests failed — check above for details.');
  process.exit(failed > 0 ? 1 : 0);
}, 100);

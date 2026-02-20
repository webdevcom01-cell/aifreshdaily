import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SITE_URL = 'https://aifreshdaily.com';
const SITE_TITLE = 'AI Fresh Daily';
const SITE_DESCRIPTION =
  'The latest AI news, research, and insights — delivered fresh every day.';

interface ArticleRow {
  id: string;
  headline: string;
  excerpt: string | null;
  category: string;
  published_at: string | null;
  tags: string[] | null;
  image: string | null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from('articles')
    .select('id, headline, excerpt, category, published_at, tags, image')
    .order('published_at', { ascending: false })
    .limit(50);

  const articles = (data ?? []) as ArticleRow[];

  const items = articles
    .map((a) => {
      const url = `${SITE_URL}/article/${a.id}`;
      const pubDate = a.published_at
        ? new Date(a.published_at).toUTCString()
        : new Date().toUTCString();
      const description = a.excerpt ? escapeXml(a.excerpt) : '';
      const categoryTag = a.category
        ? `<category>${escapeXml(a.category)}</category>`
        : '';
      const enclosure =
        a.image && a.image.startsWith('http')
          ? `<enclosure url="${escapeXml(a.image)}" type="image/jpeg" length="0" />`
          : '';
      const tagItems = (a.tags ?? [])
        .map((t) => `<category>${escapeXml(t)}</category>`)
        .join('\n      ');

      return `
    <item>
      <title>${escapeXml(a.headline)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      ${categoryTag}
      ${tagItems}
      ${enclosure}
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

import type { MetadataRoute } from 'next';
import { fetchAllArticleIds, fetchPopularTags } from '@/lib/supabase';

const SITE_URL = 'https://aifreshdaily.com';

const CATEGORIES = ['models', 'agents', 'tools', 'research', 'business', 'policy', 'hardware', 'learn'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    ...CATEGORIES.map((slug) => ({
      url: `${SITE_URL}/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/subscribe`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Dynamic tag pages from popular tags
  let tagPages: MetadataRoute.Sitemap = [];
  try {
    const tags = await fetchPopularTags(50);
    tagPages = tags.map(({ tag }) => ({
      url: `${SITE_URL}/tag/${tag}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch {
    // Don't fail sitemap if Supabase is unavailable
  }

  // Dynamic article pages from Supabase
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const ids = await fetchAllArticleIds();
    articlePages = ids.map((id) => ({
      url: `${SITE_URL}/article/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // Don't fail sitemap if Supabase is unavailable
  }

  return [...staticPages, ...tagPages, ...articlePages];
}

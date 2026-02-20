"use client"
import { useState, useEffect } from 'react';
import { fetchPopularTags } from '@/lib/supabase';
import { TrendingUp, Flame } from 'lucide-react';
import Link from 'next/link';

type TagEntry = { tag: string; count: number };

export default function TrendingTopics() {
  const [tags, setTags] = useState<TagEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPopularTags(8)
      .then((data) => { setTags(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  // Format tag label: "openai" → "OpenAI", "gpt-4o" → "GPT-4o"
  function formatTag(tag: string): string {
    return tag
      .split('-')
      .map((word) =>
        ['openai', 'gpt', 'llm', 'ai', 'api', 'agi', 'rlhf', 'llms', 'gpu', 'tpu'].includes(word.toLowerCase())
          ? word.toUpperCase()
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ');
  }

  if (isLoading) {
    return (
      <section className="py-8 bg-gray-50 dark:bg-ai-space-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-ai-purple dark:text-ai-cyan" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Trending in AI</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-ai-purple/20 to-transparent" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 bg-white dark:bg-ai-space rounded-xl border border-gray-200 dark:border-ai-space-medium animate-pulse">
                <div className="h-3 w-8 bg-gray-200 dark:bg-ai-space-medium rounded mb-2" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-ai-space-medium rounded mb-1" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-ai-space-medium rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-gray-50 dark:bg-ai-space-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-ai-purple dark:text-ai-cyan" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Trending in AI</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-ai-purple/20 to-transparent" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tags.map((entry, index) => {
            const isTrending = index < 4;
            return (
              <Link
                key={entry.tag}
                href={`/tag/${entry.tag}`}
                className="group p-4 bg-white dark:bg-ai-space rounded-xl border border-gray-200 dark:border-ai-space-medium hover:border-ai-purple/30 dark:hover:border-ai-cyan/30 transition-all hover:shadow-ai-glow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-ai-purple dark:text-ai-cyan font-mono-ai">#{index + 1}</span>
                  {isTrending && <Flame className="w-3.5 h-3.5 text-orange-500" />}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-ai-purple dark:group-hover:text-ai-cyan transition-colors font-heading">
                  {formatTag(entry.tag)}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono-ai">
                  {entry.count} {entry.count === 1 ? 'article' : 'articles'}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

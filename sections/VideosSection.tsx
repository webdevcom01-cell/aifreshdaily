"use client"
import { useState, useEffect } from 'react';
import { Play, Film, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { fetchVideoArticles } from '@/lib/supabase';
import type { Article } from '@/types';

export default function VideosSection() {
  const [videos, setVideos] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVideoArticles(6)
      .then((data) => { setVideos(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  // Don't render the section at all if no video articles exist
  if (!isLoading && videos.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-white dark:bg-ai-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Film className="w-5 h-5 text-ai-purple dark:text-ai-cyan" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">AI Lab — Video</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-ai-purple/20 to-transparent" />
          <Link href="/category/learn" className="text-sm font-medium text-ai-purple dark:text-ai-cyan hover:underline flex items-center gap-1 group">
            All videos
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-video bg-gray-200 dark:bg-ai-space-medium animate-pulse rounded-xl" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-ai-space-medium rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-ai-space-medium rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/article/${video.id}`}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl">
                  {video.image ? (
                    <img
                      src={video.image}
                      alt={video.headline}
                      className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gray-200 dark:bg-ai-space-medium" />
                  )}
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 ai-gradient-bg rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ai-glow-sm">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                  </div>
                  {/* Category Badge */}
                  {video.category && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-ai-purple/80 backdrop-blur-sm text-white text-xs font-bold uppercase rounded-full">
                      {video.category}
                    </div>
                  )}
                  {/* Read time as duration proxy */}
                  {video.readTime && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/80 text-white text-xs font-mono-ai rounded">
                      {video.readTime}
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-ai-purple dark:group-hover:text-ai-cyan transition-colors font-heading line-clamp-2">
                  {video.headline}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

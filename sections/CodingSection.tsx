"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Code, ExternalLink } from 'lucide-react';
import { fetchByCategory } from '@/lib/supabase';
import type { Article } from '@/types';

export default function CodingSection() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchByCategory('tools', 6)
            .then((data) => { setArticles(data); setIsLoading(false); })
            .catch(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <section className="py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-900 dark:bg-white/10 rounded-lg">
                        <Terminal className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Tools & Dev</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 aspect-[16/9] bg-gray-200 dark:bg-ai-space-medium rounded-xl animate-pulse" />
                    <div className="lg:col-span-2 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                                <div className="w-20 h-20 bg-gray-200 dark:bg-ai-space-medium rounded-lg animate-pulse flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-12 bg-gray-200 dark:bg-ai-space-medium rounded animate-pulse" />
                                    <div className="h-3 bg-gray-200 dark:bg-ai-space-medium rounded animate-pulse" />
                                    <div className="h-3 w-2/3 bg-gray-200 dark:bg-ai-space-medium rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (articles.length === 0) {
        return (
            <section className="py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-900 dark:bg-white/10 rounded-lg">
                        <Terminal className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Tools & Dev</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No tools articles yet.</p>
            </section>
        );
    }

    const featured = articles[0];
    const sideArticles = articles.slice(1);

    return (
        <section className="py-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-900 dark:bg-white/10 rounded-lg">
                    <Terminal className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                    Tools & Dev
                </h2>
                <span className="font-mono-ai text-sm text-green-500 dark:text-green-400">{'> _'} The New Developer Stack</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Link href={`/article/${featured.id}`} className="lg:col-span-3 group block cursor-pointer">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
                        <div className="relative aspect-[16/9] overflow-hidden">
                            <img src={featured.image} alt={featured.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-green-500/90 text-white text-[10px] font-mono-ai rounded font-bold uppercase">
                                        <Code className="w-3 h-3 inline mr-1" />{featured.category}
                                    </span>
                                    {featured.isFeatured && (
                                        <span className="px-2 py-0.5 ai-gradient-bg text-white text-[10px] font-mono-ai rounded font-bold uppercase">Featured</span>
                                    )}
                                </div>
                                <h3 className="text-lg sm:text-xl font-heading font-bold text-white leading-tight">{featured.headline}</h3>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-300">
                                    <span>{featured.author}</span><span>·</span><span>{featured.readTime}</span><span>·</span><span>{featured.publishedAt}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
                <div className="lg:col-span-2 space-y-4">
                    {sideArticles.map((article) => (
                        <Link href={`/article/${article.id}`} key={article.id} className="group flex gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                <img src={article.image} alt={article.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-mono-ai text-green-500 dark:text-green-400 uppercase font-bold">{'>'} {article.category}</span>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mt-0.5 line-clamp-2 group-hover:text-ai-purple dark:group-hover:text-ai-cyan transition-colors">{article.headline}</h4>
                                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                                    <span>{article.readTime}</span><ExternalLink className="w-3 h-3" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

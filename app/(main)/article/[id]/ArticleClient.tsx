"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchArticleById, fetchByCategory } from '@/lib/supabase';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { Article } from '@/types';
import {
  ArrowLeft, Clock, User, Calendar, Share2, Twitter, Linkedin,
  Link as LinkIcon, Bookmark, BookmarkCheck,
  Sparkles, CheckCircle2, Lightbulb,
} from 'lucide-react';

function generateFallbackSummary(article: Article): string {
  return `This article covers a significant development in the AI space: ${article.headline}. The story highlights ongoing trends in artificial intelligence and its broader implications for industry and society.`;
}
function generateFallbackKeyPoints(article: Article): string[] {
  return [
    `${article.category} continues to be a rapidly evolving area of AI development`,
    'Industry leaders and researchers are closely monitoring these developments',
    'Enterprise adoption is accelerating across multiple sectors',
    'Regulatory frameworks are adapting to keep pace with technological progress',
  ];
}

interface Props {
  id: string;
  initialArticle: Article | null;
}

export default function ArticleClient({ id, initialArticle }: Props) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [readingProgress, setReadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [article, setArticle] = useState<Article | null>(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (initialArticle) return;
    fetchArticleById(id).then(setArticle).finally(() => setLoading(false));
  }, [id, initialArticle]);

  useEffect(() => {
    if (!article) return;
    fetchByCategory(article.category, 4)
      .then((data) => setRelatedArticles(data.filter((a) => a.id !== article.id).slice(0, 3)))
      .catch(() => {});
  }, [article?.category, article?.id]);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.min((window.scrollY / docHeight) * 100, 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-ai-purple/20 border-t-ai-purple rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-8">This article doesn&apos;t exist or has been removed.</p>
        <Link href="/" className="inline-flex items-center gap-2 ai-gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90">
          <ArrowLeft className="w-4 h-4" />Back to Home
        </Link>
      </div>
    );
  }

  const summary = article.summary || generateFallbackSummary(article);
  const keyPoints = article.keyPoints || generateFallbackKeyPoints(article);
  const saved = isBookmarked(article.id);

  return (
    <>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
        <div className="h-full ai-gradient-bg transition-all duration-150 ease-out" style={{ width: `${readingProgress}%` }} />
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + Category */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider ai-gradient-bg text-white rounded-full">
            {article.category}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground leading-tight mb-6">
          {article.headline}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
          {article.author && <div className="flex items-center gap-1.5"><User className="w-4 h-4" /><span className="font-medium">{article.author}</span></div>}
          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{article.readTime}</span></div>
          {article.publishedAt && <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{article.publishedAt}</span></div>}
        </div>

        {/* Hero Image */}
        {article.image && (
          <div className="relative rounded-xl overflow-hidden mb-10 aspect-video">
            <img src={article.image} alt={article.headline} className="w-full h-full object-cover" />
            {article.isBreaking && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded animate-pulse-glow">Breaking</span>
            )}
            {article.isExclusive && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-purple-600 text-white text-xs font-bold uppercase rounded">Exclusive</span>
            )}
          </div>
        )}

        {/* Full Article Body */}
        {article.body ? (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-8 text-foreground/90 leading-relaxed">
            {article.body.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4 text-base sm:text-lg leading-relaxed">{para}</p>
            ))}
          </div>
        ) : (
          <>
            {/* AI Summary fallback */}
            <div className="mb-8 p-6 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-500">AI Summary</span>
              </div>
              <p className="text-foreground/90 leading-relaxed text-base sm:text-lg">{summary}</p>
            </div>
          </>
        )}

        {/* Key Points */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-green-500">Key Points</h2>
          </div>
          <ul className="space-y-3">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full ai-gradient-bg text-white text-xs flex items-center justify-center font-bold mt-0.5">{index + 1}</span>
                <span className="text-foreground/90 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why It Matters */}
        {article.whyItMatters && (
          <div className="mb-10 pl-6 border-l-4 border-yellow-400">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-500">Why It Matters</span>
            </div>
            <p className="text-foreground/90 leading-relaxed text-base sm:text-lg italic">{article.whyItMatters}</p>
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 text-xs font-medium bg-secondary text-muted-foreground rounded-full border border-border">#{tag}</span>
            ))}
          </div>
        )}

        {/* Share & Bookmark */}
        <div className="flex items-center justify-between py-6 border-t border-b border-border mb-12">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-muted-foreground mr-1" />
            <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.headline)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group" aria-label="Share on Twitter">
              <Twitter className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>
            <button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group" aria-label="Share on LinkedIn">
              <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>
            <button onClick={handleCopyLink} className="p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group relative" aria-label="Copy link">
              <LinkIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-foreground text-background px-2 py-1 rounded whitespace-nowrap">Copied!</span>}
            </button>
          </div>
          <button onClick={() => toggleBookmark(article.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${saved ? 'ai-gradient-bg text-white ai-glow-sm' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
            {saved ? <><BookmarkCheck className="w-4 h-4" />Saved</> : <><Bookmark className="w-4 h-4" />Save Article</>}
          </button>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={`/article/${related.id}`}
                  className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all hover:shadow-lg">
                  {related.image && (
                    <div className="aspect-video overflow-hidden">
                      <img src={related.image} alt={related.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">{related.category}</span>
                    <h3 className="text-sm font-heading font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">{related.headline}</h3>
                    <p className="text-xs text-muted-foreground mt-2">{related.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}

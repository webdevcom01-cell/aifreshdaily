"use client"
import type { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'horizontal' | 'list';
  showImage?: boolean;
  className?: string;
}

function TagList({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}

export default function ArticleCard({
  article,
  variant = 'default',
  showImage = true,
  className = '',
}: ArticleCardProps) {
  const { headline, image, category, author, readTime, isExclusive, tags } = article;

  if (variant === 'compact') {
    return (
      <article className={`group cursor-pointer ${className}`}>
        <div className="flex gap-3">
          {showImage && image && (
            <div className="flex-shrink-0 w-20 h-16 overflow-hidden rounded-lg">
              <img
                src={image}
                alt={headline}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 group-hover:text-[#003366] dark:group-hover:text-blue-400 transition-colors">
              {headline}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{readTime}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article className={`group cursor-pointer ${className}`}>
        <div className="flex gap-4">
          <div className="flex-1">
            {isExclusive && (
              <span className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide mb-2">
                Exclusive
              </span>
            )}
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-[#003366] dark:group-hover:text-blue-400 transition-colors">
              {headline}
            </h3>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{readTime}</span>
            </div>
          </div>
          {showImage && image && (
            <div className="flex-shrink-0 w-28 sm:w-36">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={image}
                  alt={headline}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }

  if (variant === 'list') {
    return (
      <article className={`group cursor-pointer py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-[#003366] dark:group-hover:text-blue-400 transition-colors">
          {headline}
        </h4>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{readTime}</span>
        </div>
      </article>
    );
  }

  // Default variant
  return (
    <article className={`group cursor-pointer ${className}`}>
      {showImage && image && (
        <div className="relative overflow-hidden rounded-lg mb-3">
          <img
            src={image}
            alt={headline}
            className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div>
        {isExclusive && (
          <span className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide mb-2">
            Exclusive
          </span>
        )}
        {category && (
          <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {category}
          </span>
        )}
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-[#003366] dark:group-hover:text-blue-400 transition-colors line-clamp-3">
          {headline}
        </h3>
        {author && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{author}</p>}
        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{readTime}</span>
        </div>
        <TagList tags={tags} />
      </div>
    </article>
  );
}

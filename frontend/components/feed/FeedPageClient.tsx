'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostsAction } from '@/app/actions/posts';

// ─── Post Card Skeleton Loader ───────────────────────────────────────────────
function PostCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-outline-variant/30"></div>
        <div className="w-24 h-4 bg-outline-variant/30 rounded"></div>
        <div className="w-2 h-4 bg-outline-variant/30 rounded"></div>
        <div className="w-12 h-4 bg-outline-variant/30 rounded"></div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-outline-variant/30 rounded w-5/6"></div>
          <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
          <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
          <div className="h-4 bg-outline-variant/30 rounded w-2/3"></div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <div className="w-20 h-6 bg-outline-variant/30 rounded-full"></div>
              <div className="w-16 h-4 bg-outline-variant/30 rounded"></div>
            </div>
          </div>
        </div>
        <div className="w-[80px] h-[80px] xs:w-[120px] xs:h-[90px] sm:w-[160px] sm:h-[107px] bg-outline-variant/30 rounded-lg shrink-0"></div>
      </div>
      <div className="w-full h-px bg-outline-variant/10 pt-4"></div>
    </div>
  );
}

interface FeedPageClientProps {
  initialPosts: any[];
  initialCategories: string[];
  categoryParam: string | null;
  searchParam: string | null;
}

export default function FeedPageClient({
  initialPosts,
  initialCategories,
  categoryParam,
  searchParam,
}: FeedPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dynamic Tabs & Filter States
  const [activeTab, setActiveTab] = useState(categoryParam || 'For you');
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync state with props when server-side content updates
  useEffect(() => {
    setPosts(initialPosts);
    setPage(1);
    // Determine if next page might exist based on count
    setHasNextPage(initialPosts.length >= 10);
  }, [initialPosts]);

  useEffect(() => {
    setActiveTab(categoryParam || 'For you');
  }, [categoryParam]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (tab === 'For you') {
      params.delete('category');
    } else {
      params.set('category', tab);
    }
    router.push(`/feed?${params.toString()}`);
  };

  const handleLoadMore = async () => {
    if (!hasNextPage || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const result = await getPostsAction(nextPage, activeTab, searchParam || undefined);
      if (result && result.success && Array.isArray(result.data)) {
        setPosts((prev) => [...prev, ...result.data]);
        setPage(nextPage);
        setHasNextPage(result.pagination?.hasNextPage || false);
      }
    } catch (err) {
      console.error('Failed to load more posts via Server Action:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const calculateReadingTime = (htmlStr: string) => {
    if (!htmlStr) return 1;
    const text = htmlStr.replace(/<\/?[^>]+(>|$)/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes || 1;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <main className="flex-1 max-w-[800px] w-full min-h-[calc(100vh-57px)]">
      {/* Navigation Tabs Header */}
      <div className="sticky top-[57px] bg-surface/95 backdrop-blur z-40 border-b border-outline-variant/30 px-6 pt-6">
        <div className="flex gap-6 overflow-x-auto no-scrollbar items-center">
          {['For you', 'Following'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`pb-4 whitespace-nowrap text-sm font-label-caps transition-colors relative cursor-pointer border-none bg-transparent ${
                activeTab === tab && !searchParam
                  ? 'text-on-surface font-bold' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
              {activeTab === tab && !searchParam && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
              )}
            </button>
          ))}

          {activeTab !== 'For you' && activeTab !== 'Following' && (
            <div className="pb-4 whitespace-nowrap text-sm font-label-caps relative flex items-center gap-1.5 text-primary font-bold">
              <span>{activeTab}</span>
              <button
                onClick={() => handleTabChange('For you')}
                className="p-0.5 hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center cursor-pointer select-none text-primary border-none bg-transparent"
                title="Clear topic filter"
              >
                <span className="material-symbols-outlined text-[15px] font-bold">close</span>
              </button>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
            </div>
          )}

          {searchParam && (
            <div className="pb-4 whitespace-nowrap text-sm font-label-caps relative flex items-center gap-1.5 text-primary font-bold animate-fade-in">
              <span>Search: "{searchParam}"</span>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
                  params.delete('search');
                  router.push(`/feed?${params.toString()}`);
                }}
                className="p-0.5 hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center cursor-pointer select-none text-primary border-none bg-transparent"
                title="Clear search filter"
              >
                <span className="material-symbols-outlined text-[15px] font-bold">close</span>
              </button>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Feed Posts Canvas */}
      <div className="p-6 space-y-12">
        {loading ? (
          <div className="space-y-12">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <span className="material-symbols-outlined text-5xl text-outline-variant animate-bounce">article</span>
            <h3 className="font-headline-md text-xl text-on-surface font-semibold">No stories here yet</h3>
            <p className="font-body-md text-on-surface-variant max-w-sm mx-auto">
              There are no published articles under this topic right now. Try check back later or start writing a new story!
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => {
              const author = post.authorId || {};
              const readTime = calculateReadingTime(post.htmlContent);
              const formattedDate = formatDate(post.createdAt);
              
              return (
                <article 
                  key={post._id} 
                  onClick={() => router.push(`/feed/${post.slug}`)}
                  className="group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {author.avatar ? (
                      <img src={author.avatar} className="w-6 h-6 rounded-full object-cover" alt={author.name || 'Author'} />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {getAvatarFallback(author.name)}
                      </div>
                    )}
                    <span className="font-body-md text-sm text-on-surface font-medium">{author.name || 'Anonymous'}</span>
                    <span className="text-on-surface-variant text-sm">·</span>
                    <span className="font-body-md text-sm text-on-surface-variant">{formattedDate}</span>
                  </div>
                  
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="font-body-md text-on-surface-variant text-base line-clamp-3 mb-4 leading-relaxed">
                        {post.excerpt || 'No description provided.'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {post.category && (
                            <span className="px-3 py-1 bg-surface-container-low text-on-surface rounded-full text-xs font-label-caps border border-outline-variant/20">{post.category}</span>
                          )}
                          <span className="font-body-md text-sm text-on-surface-variant">{readTime} min read</span>
                        </div>
                      </div>
                    </div>
                    
                    {post.coverImage && (
                      <div className="w-[80px] h-[80px] xs:w-[120px] xs:h-[90px] sm:w-[160px] sm:h-[107px] overflow-hidden rounded-lg border border-outline-variant/30 shrink-0 self-center sm:self-start">
                        <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Article Cover" />
                      </div>
                    )}
                  </div>
                  <div className="w-full h-px bg-outline-variant/20 mt-12"></div>
                </article>
              );
            })}

            {/* Load More Trigger Button */}
            {hasNextPage && (
              <div className="pt-8 pb-12 flex justify-center">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 border border-outline-variant rounded-full font-label-caps text-on-surface hover:bg-surface-container-low hover:border-outline transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? 'Loading more...' : 'Load more articles'}
                  {!loadingMore && <span className="material-symbols-outlined text-[18px]">expand_more</span>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

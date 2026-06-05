'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import { useUIStore } from '@/lib/ui-store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

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

// ─── Main Feed Page Wrapper (Suspense Guard) ──────────────────────────────────
export default function FeedPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center select-none">
          <span className="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
        </div>
      }
    >
      <FeedPageContent />
    </Suspense>
  );
}

// ─── Inner Feed Page Content ──────────────────────────────────────────────────
function FeedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams ? searchParams.get('category') : null;
  const searchParam = searchParams ? searchParams.get('search') : null;
  const { sidebarOpen } = useUIStore();

  // Dynamic Tabs & Filter States
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('For you');

  // Posts Feed & Pagination States
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Sync activeTab with categoryParam from searchParams
  useEffect(() => {
    if (categoryParam) {
      setActiveTab(categoryParam);
    } else {
      setActiveTab('For you');
    }
  }, [categoryParam]);

  // Fetch Categories on Mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API}/posts/categories`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Posts on Tab, Search, or Initial Load
  const fetchPosts = async (pageNum: number, tabName: string, isAppend = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let url = `${API}/posts?page=${pageNum}&limit=10`;
      
      // Category filter query check (ignore For you & Following)
      if (tabName !== 'For you' && tabName !== 'Following') {
        url += `&category=${encodeURIComponent(tabName)}`;
      }

      if (searchParam) {
        url += `&search=${encodeURIComponent(searchParam)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        if (isAppend) {
          setPosts((prev) => [...prev, ...data.data]);
        } else {
          setPosts(data.data);
        }
        setHasNextPage(data.pagination?.hasNextPage || false);
      }
    } catch (err) {
      console.error('Failed to query posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reset page and trigger fetch on tab or search parameter changes
  useEffect(() => {
    fetchPosts(1, activeTab, false);
    setPage(1);
  }, [activeTab, searchParam]);

  const handleLoadMore = () => {
    if (!hasNextPage || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, activeTab, true);
  };

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (tab === 'For you') {
      params.delete('category');
    } else {
      params.set('category', tab);
    }
    router.push(`/feed?${params.toString()}`);
  };

  // Word-count reading estimator (200 words per minute rule)
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
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNavBar />
      
      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto flex gap-6 md:gap-10 px-4 md:px-6">
        <SideNavBar />
        
        <div className="flex-1 flex justify-center w-full">
          <main className="flex-1 max-w-[800px] w-full min-h-[calc(100vh-57px)]">
            
            {/* Navigation Tabs Header */}
            <div className="sticky top-[57px] bg-surface/95 backdrop-blur z-40 border-b border-outline-variant/30 px-6 pt-6">
              <div className="flex gap-6 overflow-x-auto no-scrollbar items-center">
                {['For you', 'Following'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`pb-4 whitespace-nowrap text-sm font-label-caps transition-colors relative cursor-pointer ${
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
                              <div className="flex items-center gap-3 text-on-surface-variant">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }} 
                                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                                >
                                  <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                                >
                                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                </button>
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
        </div>
      </div>
    </div>
  );
}

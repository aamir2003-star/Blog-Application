'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import LibraryHeader from '@/components/library/LibraryHeader';
import LibraryListsGrid from '@/components/library/LibraryListsGrid';
import ReadingHistoryFeed from '@/components/library/ReadingHistoryFeed';
import {
  useBookmarksQuery,
  useToggleBookmarkMutation,
  useReadingHistoryQuery,
} from '@/hooks/useBookmarks';

function calculateReadingTime(htmlStr: string): number {
  if (!htmlStr) return 1;
  const text = htmlStr.replace(/<\/?[^>]+(>|$)/g, '');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes || 1;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LibraryPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── States ──
  const [activeTab, setActiveTab] = useState<'stories' | 'history'>('stories');

  // ── Strict Authentication check ──
  useEffect(() => {
    if (authLoading) return;
    if (user === null) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── React Query Queries & Mutations ──
  const { data: bookmarksData, isLoading: bookmarksLoading, error: bookmarksError } = useBookmarksQuery(accessToken);
  const { data: historyData, isLoading: historyLoading, error: historyError } = useReadingHistoryQuery(accessToken);
  const toggleBookmarkMutation = useToggleBookmarkMutation(accessToken);

  const EMPTY_ARRAY: any[] = [];
  const bookmarks = bookmarksData || EMPTY_ARRAY;
  const historyList = historyData || EMPTY_ARRAY;

  const handleToggleBookmark = (postId: string) => {
    toggleBookmarkMutation.mutate(postId);
  };

  const getShortDescription = (text: string) => {
    if (!text) return 'No description provided.';
    const words = text.trim().split(/\s+/);
    if (words.length > 20) {
      return words.slice(0, 20).join(' ') + '...';
    }
    return text;
  };

  const error = bookmarksError?.message || historyError?.message || null;
  const loading = bookmarksLoading;

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center select-none">
        <span className="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />

      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto flex gap-6 md:gap-10 px-4 md:px-6">
        <SideNavBar />

        <div className="flex-1 flex justify-center py-10 transition-all duration-[450ms] ease-in-out">
          <main className="flex-1 max-w-[800px] w-full flex flex-col min-h-[calc(100vh-57px)]">
            {error && (
              <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-xl flex items-start gap-3 select-none">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-8 animate-in fade-in duration-300">
              <LibraryHeader />
              <LibraryListsGrid
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              
              {activeTab === 'stories' && (
                <div className="divide-y divide-outline-variant/15 space-y-6 pt-4">
                  {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3 select-none">
                      <span className="material-symbols-outlined animate-spin text-primary text-[28px]">progress_activity</span>
                      <span className="font-label-caps text-xs text-on-surface-variant font-semibold tracking-wider animate-pulse">Syncing library...</span>
                    </div>
                  ) : bookmarks.length === 0 ? (
                    <div className="p-16 text-center space-y-4 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl select-none">
                      <span className="material-symbols-outlined text-outline-variant text-[44px]">bookmark_border</span>
                      <p className="font-body-md text-base font-bold text-on-surface-variant">Your library is empty</p>
                      <p className="font-body-md text-xs text-outline leading-relaxed max-w-sm mx-auto">
                        Go to the general feed page, explore new topics, and click the bookmark ribbons on publications to save stories here.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => router.push('/feed')}
                          className="bg-primary text-on-primary font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold flex items-center justify-center gap-1.5 mx-auto cursor-pointer border-none"
                        >
                          <span className="material-symbols-outlined text-[16px]">explore</span>
                          Explore Feed
                        </button>
                      </div>
                    </div>
                  ) : (
                    bookmarks.map((bookmark) => {
                      const post = bookmark.postId;
                      if (!post) return null;

                      const isRemoving = toggleBookmarkMutation.isPending && toggleBookmarkMutation.variables === post._id;
                      const readTime = calculateReadingTime(post.htmlContent);
                      const formattedDate = formatDate(post.createdAt);
                      const author = post.authorId || {};

                      return (
                        <div
                          key={post._id}
                          className={`pt-6 first:pt-0 transition-all duration-500 ${
                            isRemoving ? 'opacity-0 scale-95 select-none pointer-events-none' : ''
                          }`}
                        >
                          <article
                            onClick={() => router.push(`/feed/${post.slug}`)}
                            className="group cursor-pointer flex gap-6 items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 select-none">
                                {author.avatar ? (
                                  <img src={author.avatar} className="w-5 h-5 rounded-full object-cover" alt="Author" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                                    {author.name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                )}
                                <span className="text-xs font-semibold text-on-surface-variant">{author.name || 'Anonymous'}</span>
                                <span className="text-outline-variant/40 select-none">·</span>
                                <span className="text-xs text-on-surface-variant">{formattedDate}</span>
                              </div>

                              <h2 className="font-headline-lg text-xl font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-1.5 leading-snug">
                                {post.title}
                              </h2>
                              <p className="font-body-md text-on-surface-variant text-sm line-clamp-2 leading-relaxed">
                                {getShortDescription(post.excerpt)}
                              </p>

                              <div className="flex items-center justify-between mt-3 select-none">
                                <div className="flex items-center gap-4">
                                  {post.category && (
                                    <span className="px-2.5 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full font-label-caps border border-primary/10 font-semibold">
                                      {post.category}
                                    </span>
                                  )}
                                  <span className="text-xs text-on-surface-variant font-medium">{readTime} min read</span>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleBookmark(post._id);
                                  }}
                                  className="p-1 hover:bg-surface-container-low text-primary rounded-lg transition-colors cursor-pointer active:scale-90 border-none bg-transparent"
                                  title="Remove from library"
                                >
                                  <span 
                                    className="material-symbols-outlined text-[18px]"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    bookmark
                                  </span>
                                </button>
                              </div>
                            </div>

                            {post.coverImage && (
                              <div className="w-[120px] h-[80px] hidden sm:block rounded-lg overflow-hidden border border-outline-variant/20 shrink-0 select-none">
                                <img
                                  src={post.coverImage}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  alt="Cover"
                                />
                              </div>
                            )}
                          </article>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <ReadingHistoryFeed
                  user={user}
                  historyList={historyList}
                  loading={historyLoading}
                  inline={true}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

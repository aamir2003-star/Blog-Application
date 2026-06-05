'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LibraryHeader from '@/components/library/LibraryHeader';
import LibraryListsGrid from '@/components/library/LibraryListsGrid';
import ReadingHistoryFeed from '@/components/library/ReadingHistoryFeed';
import {
  useBookmarksQuery,
  useToggleBookmarkMutation,
  useReadingHistoryQuery,
} from '@/hooks/useBookmarks';

interface LibraryPageClientProps {
  initialBookmarks: any[];
  initialHistory: any[];
}

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

export default function LibraryPageClient({
  initialBookmarks,
  initialHistory,
}: LibraryPageClientProps) {
  const { user, accessToken } = useAuth();
  const router = useRouter();

  // ── States ──
  const [activeTab, setActiveTab] = useState<'stories' | 'history'>('stories');

  // ── React Query Queries & Mutations (warmed with initial server-fetched data) ──
  const { data: bookmarks, isLoading: bookmarksLoading, error: bookmarksError } = useBookmarksQuery(accessToken, initialBookmarks);
  const { data: historyList, isLoading: historyLoading, error: historyError } = useReadingHistoryQuery(accessToken, initialHistory);
  const toggleBookmarkMutation = useToggleBookmarkMutation(accessToken);

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

  return (
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
              ) : bookmarks && bookmarks.length === 0 ? (
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
                bookmarks && bookmarks.map((bookmark: any) => {
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
              user={user || { name: 'User' }}
              historyList={historyList || []}
              loading={historyLoading}
              inline={true}
            />
          )}
        </div>
      </main>
    </div>
  );
}

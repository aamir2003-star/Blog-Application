'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useDeleteHistoryMutation } from '@/hooks/useBookmarks';

function calculateReadingTime(htmlStr: string): number {
  if (!htmlStr) return 1;
  const text = htmlStr.replace(/<\/?[^>]+(>|$)/g, '');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes || 1;
}

interface ReadingHistoryFeedProps {
  user: {
    name: string;
  };
  historyList: any[];
  onBack?: () => void;
  loading: boolean;
  inline?: boolean;
}

export default function ReadingHistoryFeed({
  user,
  historyList,
  onBack,
  loading,
  inline = false,
}: ReadingHistoryFeedProps) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const deleteHistoryMutation = useDeleteHistoryMutation(accessToken);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeSpent = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShortDescription = (text: string) => {
    if (!text) return 'No description provided.';
    const words = text.trim().split(/\s+/);
    if (words.length > 20) {
      return words.slice(0, 20).join(' ') + '...';
    }
    return text;
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      {!inline && (
        <div className="space-y-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 font-label-caps text-xs text-secondary hover:text-on-surface transition-colors cursor-pointer select-none border-none bg-transparent focus:outline-none"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Library
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg select-none">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-on-surface text-base">{user.name}</h3>
              <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5 mt-0.5 select-none">
                <span>Reading History Tracker</span>
              </p>
            </div>
          </div>

          <h1 className="font-display-xl text-[44px] font-bold text-on-surface leading-tight tracking-tight select-none">
            Reading history
          </h1>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 select-none">
          <span className="material-symbols-outlined animate-spin text-primary text-[28px]">progress_activity</span>
          <span className="font-label-caps text-xs text-on-surface-variant font-semibold tracking-wider">Syncing reading history...</span>
        </div>
      ) : historyList.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl select-none">
          <span className="material-symbols-outlined text-outline-variant text-[44px]">history</span>
          <p className="font-body-md text-base font-bold text-on-surface-variant">No reading history yet</p>
          <p className="font-body-md text-xs text-outline leading-relaxed max-w-sm mx-auto">
            Articles you open from the dashboard feed or public pages will be cataloged here automatically.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/15 space-y-6 pt-4">
          {historyList.map((entry) => {
            const post = entry.postId;
            if (!post) return null;

            const isRemoving = deleteHistoryMutation.isPending && deleteHistoryMutation.variables === entry._id;
            const readTime = calculateReadingTime(post.htmlContent);
            const author = post.authorId || {};

            return (
              <div 
                key={entry._id} 
                className={`pt-6 first:pt-0 transition-all duration-500 ${
                  isRemoving ? 'opacity-0 scale-95 select-none pointer-events-none' : ''
                }`}
              >
                <article
                  onClick={() => router.push(`/feed/${post.slug}`)}
                  className="group cursor-pointer flex gap-6 items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    {/* Metadata header */}
                    <div className="flex items-center gap-2 mb-2 select-none">
                      {author.avatar ? (
                        <img src={author.avatar} className="w-5 h-5 rounded-full object-cover" alt="Author" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {author.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-on-surface-variant">
                        {author.name || 'Anonymous'}
                      </span>
                      <span className="text-outline-variant/40 select-none">·</span>
                      <span className="text-[11px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        Viewed {formatDate(entry.viewedAt)} at {formatTimeSpent(entry.viewedAt)}
                      </span>
                    </div>

                    {/* Title & Excerpt */}
                    <h2 className="font-headline-lg text-xl font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-1.5 leading-snug">
                      {post.title}
                    </h2>
                    <p className="font-body-md text-on-surface-variant text-sm line-clamp-2 leading-relaxed">
                      {getShortDescription(post.excerpt || post.htmlContent?.replace(/<\/?[^>]+(>|$)/g, ''))}
                    </p>

                    {/* Footer action ribbon */}
                    <div className="flex items-center mt-3 select-none">
                      <div className="flex items-center gap-4">
                        {post.category && (
                          <span className="px-2.5 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full font-label-caps border border-primary/10 font-semibold">
                            {post.category}
                          </span>
                        )}
                        <span className="text-xs text-on-surface-variant font-medium">
                          {readTime} min read
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action & Cover block */}
                  <div className="flex items-center gap-4 shrink-0 select-none">
                    {/* Cover image thumbnail */}
                    {post.coverImage && (
                      <div className="w-[120px] h-[80px] hidden sm:block rounded-lg overflow-hidden border border-outline-variant/20 shrink-0 select-none">
                        <img 
                          src={post.coverImage} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          alt="Cover" 
                        />
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryMutation.mutate(entry._id);
                      }}
                      className="p-1.5 hover:bg-surface-container-low text-on-surface-variant hover:text-error rounded-lg transition-colors cursor-pointer active:scale-90 border-none bg-transparent flex items-center justify-center"
                      title="Remove from history"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        delete
                      </span>
                    </button>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

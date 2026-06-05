'use client';

import Link from 'next/link';

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

      <div className="border-t border-outline-variant/15 my-6" />

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
        <div className="divide-y divide-outline-variant/15 space-y-6">
          {historyList.map((entry) => {
            const post = entry.postId;
            if (!post) return null;

            return (
              <div 
                key={entry._id} 
                className="pt-6 first:pt-0 space-y-4 transition-all duration-500"
              >
                <div className="flex gap-4 justify-between">
                  {/* Left Text content */}
                  <div className="flex-1 space-y-3">
                    {/* Metadata header */}
                    <div className="flex items-center gap-2 select-none">
                      {post.authorId?.avatar ? (
                        <img src={post.authorId.avatar} className="w-5 h-5 rounded-full object-cover" alt="author avatar" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px]">
                          {post.authorId?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-on-surface leading-none">
                        {post.authorId?.name || 'Anonymous'}
                      </span>
                      {post.category && (
                        <>
                          <span className="text-[10px] text-outline-variant">in</span>
                          <span className="text-xs font-semibold text-primary">{post.category}</span>
                        </>
                      )}
                      <span className="text-outline-variant/40">•</span>
                      <span className="text-[11px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        Viewed {formatDate(entry.viewedAt)} at {formatTimeSpent(entry.viewedAt)}
                      </span>
                    </div>

                    {/* Title & Excerpt */}
                    <div className="space-y-1">
                      <Link 
                        href={`/feed/${post.slug}`}
                        className="block text-xl font-bold text-on-surface hover:text-primary transition-colors leading-snug tracking-tight"
                      >
                        {post.title}
                      </Link>
                      <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                        {post.excerpt || 'No summary excerpt provided.'}
                      </p>
                    </div>

                    {/* Footer action ribbon */}
                    <div className="flex items-center justify-between pt-1 select-none">
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {calculateReadingTime(post.htmlContent)} min read
                      </span>
                    </div>
                  </div>

                  {/* Right cover image thumbnail */}
                  {post.coverImage && (
                    <div className="w-[120px] h-[80px] rounded-lg overflow-hidden border border-outline-variant/15 shrink-0 bg-surface-container-low select-none">
                      <img src={post.coverImage} className="w-full h-full object-cover" alt="post cover" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

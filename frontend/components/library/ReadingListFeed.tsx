'use client';

import Link from 'next/link';

function calculateReadingTime(htmlStr: string): number {
  if (!htmlStr) return 1;
  const text = htmlStr.replace(/<\/?[^>]+(>|$)/g, '');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes || 1;
}

interface ReadingListFeedProps {
  user: {
    name: string;
  };
  bookmarks: any[];
  onBack: () => void;
  onRemoveBookmark: (postId: string) => void;
  noteValues: Record<string, string>;
  onNoteChange: (postId: string, val: string) => void;
  onSaveNote: (postId: string) => void;
  savingNoteId: string | null;
  togglingId: string | null;
}

export default function ReadingListFeed({
  user,
  bookmarks,
  onBack,
  onRemoveBookmark,
  noteValues,
  onNoteChange,
  onSaveNote,
  savingNoteId,
  togglingId,
}: ReadingListFeedProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      {/* Back button and profile header */}
      <div className="space-y-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 font-label-caps text-xs text-secondary hover:text-on-surface transition-colors cursor-pointer select-none border-none bg-transparent"
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
            <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5 mt-0.5">
              <span>{formatDate(new Date().toISOString())}</span>
              <span>·</span>
              <span>{bookmarks.length} stories</span>
            </p>
          </div>
        </div>

        <h1 className="font-display-xl text-[44px] font-bold text-on-surface leading-tight tracking-tight">
          Reading list
        </h1>
      </div>

      {/* Subheader action row */}
      <div className="border-y border-outline-variant/20 py-3.5 flex items-center justify-between text-on-surface-variant text-sm select-none">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[20px] hover:text-on-surface transition-colors cursor-pointer">clap</span>
          <span className="material-symbols-outlined text-[20px] hover:text-on-surface transition-colors cursor-pointer">chat_bubble</span>
        </div>
        <span className="material-symbols-outlined text-[20px] hover:text-on-surface transition-colors cursor-pointer">more_horiz</span>
      </div>

      {/* Bookmark cards feed */}
      {bookmarks.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl">
          <span className="material-symbols-outlined text-outline-variant text-[44px] select-none">bookmark_border</span>
          <p className="font-body-md text-base font-bold text-on-surface-variant">Your reading list is empty</p>
          <p className="font-body-md text-xs text-outline leading-relaxed max-w-sm mx-auto">
            Go to the general feed page, explore new topics, and click the bookmark ribbons on publications to save stories here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/15 space-y-6">
          {bookmarks.map((bookmark) => {
            const post = bookmark.postId;
            if (!post) return null;

            const isRemoving = togglingId === post._id;

            return (
              <div 
                key={post._id} 
                className={`pt-6 first:pt-0 space-y-4 transition-all duration-500 ${
                  isRemoving ? 'opacity-0 scale-95 select-none pointer-events-none' : ''
                }`}
              >
                <div className="flex gap-4 justify-between">
                  {/* Left Text content */}
                  <div className="flex-1 space-y-3">
                    {/* Metadata header */}
                    <div className="flex items-center gap-2">
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
                          <span className="text-[10px] text-outline-variant select-none">in</span>
                          <span className="text-xs font-semibold text-primary">{post.category}</span>
                        </>
                      )}
                      <span className="text-outline-variant/40 select-none">·</span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {formatDate(post.createdAt)}
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
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {calculateReadingTime(post.htmlContent)} min read
                      </span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onRemoveBookmark(post._id)}
                          className="p-1 hover:bg-surface-container-low text-primary rounded-lg transition-colors cursor-pointer select-none active:scale-90 border-none bg-transparent"
                          title="Remove from library"
                        >
                          <span 
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            bookmark
                          </span>
                        </button>
                        <span className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">more_horiz</span>
                      </div>
                    </div>
                  </div>

                  {/* Right cover image thumbnail */}
                  {post.coverImage && (
                    <div className="w-[120px] h-[80px] rounded-lg overflow-hidden border border-outline-variant/15 shrink-0 bg-surface-container-low select-none">
                      <img src={post.coverImage} className="w-full h-full object-cover" alt="post cover" />
                    </div>
                  )}
                </div>

                {/* Notes Add Input Area */}
                <div className="bg-surface-container-low/40 rounded-xl p-3.5 border border-outline-variant/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold font-label-caps uppercase text-on-surface-variant">
                    <span className="material-symbols-outlined text-[13px] text-primary">edit_note</span>
                    <span>Personal note</span>
                  </div>
                  
                  <textarea
                    placeholder="Add a private note to remember details or takeaways from this story..."
                    value={noteValues[post._id] ?? ''}
                    onChange={(e) => onNoteChange(post._id, e.target.value)}
                    rows={2}
                    className="w-full text-xs bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-2.5 text-on-surface focus:outline-none focus:border-primary transition-all font-sans leading-normal resize-none"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onSaveNote(post._id)}
                      disabled={savingNoteId === post._id}
                      className="bg-primary text-on-primary font-label-caps text-[10px] tracking-wider px-3.5 py-1.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 border-none"
                    >
                      {savingNoteId === post._id ? (
                        <span className="material-symbols-outlined animate-spin text-[10px]">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[12px]">save</span>
                      )}
                      {savingNoteId === post._id ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

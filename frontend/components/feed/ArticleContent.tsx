'use client';

interface ArticleContentProps {
  post: any;
  onToggleBookmark: () => void;
  bookmarking: boolean;
}

export default function ArticleContent({
  post,
  onToggleBookmark,
  bookmarking,
}: ArticleContentProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const calculateReadingTime = (htmlStr: string) => {
    if (!htmlStr) return 1;
    const text = htmlStr.replace(/<\/?[^>]+(>|$)/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes || 1;
  };

  return (
    <article className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Category Tag */}
      {post.category && (
        <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-semibold tracking-wider font-label-caps border border-primary/20">
          {post.category}
        </span>
      )}

      {/* Article Title */}
      <h1 className="font-headline-lg text-3xl md:text-4xl lg:text-[40px] font-bold text-on-surface leading-[1.1] tracking-tight">
        {post.title}
      </h1>

      {/* Author Profile Metadata Row */}
      <div className="flex items-center justify-between border-y border-outline-variant/30 py-4">
        <div className="flex items-center gap-3">
          {post.authorId?.avatar ? (
            <img 
              src={post.authorId.avatar} 
              className="w-10 h-10 rounded-full object-cover border border-outline-variant/20" 
              alt={post.authorId.name || 'Author'} 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {getAvatarFallback(post.authorId?.name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-body-md text-sm text-on-surface font-semibold">{post.authorId?.name || 'Anonymous'}</span>
              {post.authorId?.role === 'CREATOR' && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold font-label-caps uppercase">Creator</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span>{formatDate(post.createdAt)}</span>
              <span>·</span>
              <span>{calculateReadingTime(post.htmlContent)} min read</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-on-surface-variant text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>{post.totalViews ?? post.views ?? 0} views</span>
          </div>
          <span className="text-outline-variant/40 select-none">|</span>
          <button
            onClick={onToggleBookmark}
            disabled={bookmarking}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-container-low transition-all active:scale-95 cursor-pointer focus:outline-none disabled:opacity-50 select-none border-none bg-transparent ${
              post.isBookmarked ? 'text-primary bg-primary/5' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title={post.isBookmarked ? 'Saved to library' : 'Save to library'}
          >
            <span 
              className="material-symbols-outlined text-[18px]"
              style={post.isBookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              bookmark
            </span>
            <span className="text-xs font-semibold font-label-caps uppercase tracking-wider">
              {post.isBookmarked ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>
      </div>

      {/* Optional Cover Image Banner */}
      {post.coverImage && (
        <div className="w-full aspect-[2/1] overflow-hidden rounded-xl border border-outline-variant/30">
          <img 
            src={post.coverImage} 
            className="w-full h-full object-cover animate-in zoom-in-95 duration-500" 
            alt={post.title} 
          />
        </div>
      )}

      {/* Rich-Text Content Column */}
      <div className="tiptap font-serif text-lg leading-relaxed text-on-surface/90 pt-4">
        <div dangerouslySetInnerHTML={{ __html: post.htmlContent }} />
      </div>
    </article>
  );
}

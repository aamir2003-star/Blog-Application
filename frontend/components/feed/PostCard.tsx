'use client';

interface PostCardProps {
  post: any;
  onClick: () => void;
}

export default function PostCard({ post, onClick }: PostCardProps) {
  const author = post.authorId || {};

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

  const readTime = calculateReadingTime(post.htmlContent);
  const formattedDate = formatDate(post.createdAt);

  return (
    <article 
      onClick={onClick}
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
          <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
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
}

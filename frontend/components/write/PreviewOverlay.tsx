'use client';

import { CanvasBlock } from './CanvasBlocks';

interface PreviewOverlayProps {
  showPreview: boolean;
  canvasBlocks: CanvasBlock[];
  category: string;
  title: string;
  coverImage: string;
  excerpt: string;
  keywordChips: string[];
  readingTime: number;
  user: any;
  onClose: () => void;
  onExit: () => void;
}

export default function PreviewOverlay({
  showPreview,
  canvasBlocks,
  category,
  title,
  coverImage,
  excerpt,
  keywordChips,
  readingTime,
  user,
  onClose,
  onExit,
}: PreviewOverlayProps) {
  if (!showPreview) return null;

  const compileCanvasBlocks = (blocks: CanvasBlock[]): string => {
    return blocks
      .map((block) => {
        if (block.type === 'content') {
          return `<!-- block:content -->\n${block.value}`;
        }
        if (block.type === 'image_block') {
          const captionEncoded = encodeURIComponent(block.caption || '');
          return `<!-- block:image_block caption:${captionEncoded} -->\n<figure class="my-6 text-center"><img src="${block.value}" alt="${block.caption || 'Image'}" class="rounded-lg max-w-full mx-auto" />${block.caption ? `<figcaption class="text-xs text-on-surface-variant/80 mt-2 font-body-md">${block.caption}</figcaption>` : ''}</figure>`;
        }
        if (block.type === 'code_block') {
          const lang = block.language || 'javascript';
          return `<!-- block:code_block language:${lang} -->\n<pre><code class="language-${lang}">${block.value}</code></pre>`;
        }
        return '';
      })
      .join('\n\n');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-surface overflow-y-auto flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-300 font-body-md">
      <header className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 px-6 py-4 flex justify-between items-center z-10 w-full select-none">
        <div className="flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-primary text-[20px]">visibility</span>
          <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Story Reader Preview</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="font-label-caps text-xs text-on-surface-variant hover:text-on-surface px-4 py-2.5 rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-all cursor-pointer bg-transparent"
          >
            Go Back & Edit
          </button>
          <button
            onClick={onExit}
            className="bg-primary text-on-primary font-label-caps text-xs px-6 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 cursor-pointer border-none"
          >
            Finish & Exit
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </header>

      <article className="max-w-[720px] w-full mx-auto px-6 py-12 flex flex-col">
        {category && (
          <div className="mb-4 select-none">
            <span className="px-3.5 py-1 bg-primary/10 text-primary text-xs font-label-caps border border-primary/20 rounded-full font-semibold">
              {category}
            </span>
          </div>
        )}

        <h1 className="font-display-xl text-4xl md:text-5xl font-bold text-on-surface leading-tight mb-6">
          {title}
        </h1>

        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-outline-variant/15 select-none">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/30">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-label-caps text-on-surface text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-body-md text-sm font-bold text-on-surface">{user?.name || 'Anonymous Author'}</p>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-body-md mt-0.5">
              <span>Published Today</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px]">schedule</span>{readingTime} min read</span>
            </div>
          </div>
        </div>

        {excerpt && (
          <div className="mb-8 p-5 bg-surface-container-low border-l-4 border-primary rounded-r-xl italic font-serif text-on-surface-variant text-base leading-relaxed">
            "{excerpt}"
          </div>
        )}

        {coverImage && (
          <div className="mb-10 aspect-video rounded-xl overflow-hidden border border-outline-variant/20 shadow-md">
            <img
              src={coverImage}
              alt="Article Cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Compiled HTML preview */}
        <div 
          className="tiptap font-serif leading-relaxed text-on-surface text-lg md:text-xl space-y-6"
          dangerouslySetInnerHTML={{ __html: compileCanvasBlocks(canvasBlocks) }}
        />

        {keywordChips.length > 0 && (
          <div className="mt-12 pt-6 border-t border-outline-variant/15 flex flex-wrap gap-2 select-none">
            {keywordChips.map((chip, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs rounded-full font-label-caps border border-outline-variant/20 flex items-center gap-0.5 font-medium"
              >
                <span className="text-[10px] text-on-surface-variant/70">#</span>
                {chip}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

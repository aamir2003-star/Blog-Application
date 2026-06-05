'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

import WriteBar from '@/components/write/WriteBar';
import PreviewOverlay from '@/components/write/PreviewOverlay';
import EditorCanvas from '@/components/write/EditorCanvas';
import { MetadataBlockCard, MetadataBlockType, CanvasBlock } from '@/components/write/CanvasBlocks';

import {
  useCategoriesQuery,
  usePostDetailQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
} from '@/hooks/usePosts';

const DEFAULT_CATEGORIES = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
  'System Design', 'DevOps', 'Databases', 'Cloud & AWS', 'Security',
  'Algorithms & DSA', 'Career & Growth', 'Open Source', 'Other'
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const compileCanvasBlocks = (blocks: CanvasBlock[]): string => {
  return blocks
    .map((block) => {
      if (block.type === 'content') return `<!-- block:content -->\n${block.value}`;
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

const parseHtmlToBlocks = (html: string): CanvasBlock[] => {
  if (!html) return [];
  if (!html.includes('<!-- block:')) {
    return [{ id: `content_${Math.random().toString(36).slice(2, 9)}`, type: 'content', value: html }];
  }
  const blocks: CanvasBlock[] = [];
  const parts = html.split('<!-- block:');
  
  if (parts[0].trim()) {
    blocks.push({ id: `content_${Math.random().toString(36).slice(2, 9)}`, type: 'content', value: parts[0].trim() });
  }

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const closeCommentIdx = part.indexOf('-->');
    if (closeCommentIdx === -1) continue;

    const header = part.slice(0, closeCommentIdx).trim();
    const content = part.slice(closeCommentIdx + 3).trim();
    const id = `${header.split(' ')[0]}_${Math.random().toString(36).slice(2, 9)}`;

    if (header === 'content') {
      blocks.push({ id, type: 'content', value: content });
    } else if (header.startsWith('image_block')) {
      let caption = '';
      const captionMatch = header.match(/caption:([^ ]+)/);
      if (captionMatch) caption = decodeURIComponent(captionMatch[1]);
      const srcMatch = content.match(/src="([^"]+)"/);
      blocks.push({ id, type: 'image_block', value: srcMatch ? srcMatch[1] : '', caption });
    } else if (header.startsWith('code_block')) {
      let language = 'javascript';
      const langMatch = header.match(/language:([^ ]+)/);
      if (langMatch) language = langMatch[1];
      const codeMatch = content.match(/<code[^>]*>([\s\S]*?)<\/code>/);
      blocks.push({ id, type: 'code_block', value: codeMatch ? codeMatch[1] : '', language });
    }
  }
  return blocks;
};

export default function WritePage() {
  const { user, accessToken, refreshUser } = useAuth();
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── States ──
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [keywords, setKeywords] = useState('');
  
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);
  const [activeBlocks, setActiveBlocks] = useState<MetadataBlockType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [createdPost, setCreatedPost] = useState<any>(null);

  const [postId, setPostId] = useState<string | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [urlPostId, setUrlPostId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'offline_saved' | 'error'>('idle');
  const [showManualSavedTick, setShowManualSavedTick] = useState(false);
  const lastSavedRef = useRef<string>('');

  // ── Retrieve categories and post details using React Query ──
  const { data: fetchedCategories } = useCategoriesQuery();
  const categoriesList = fetchedCategories || DEFAULT_CATEGORIES;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setUrlPostId(id);
        setLoadingPost(true);
      }
    }
  }, []);

  const { data: fetchedPost, error: fetchError } = usePostDetailQuery(urlPostId, accessToken);

  useEffect(() => {
    if (fetchedPost) {
      setPostId(fetchedPost._id);
      setTitle(fetchedPost.title || '');
      setCategory(fetchedPost.category === 'Other' ? '' : (fetchedPost.category || ''));
      setCoverImage(fetchedPost.coverImage || '');
      setExcerpt(fetchedPost.excerpt === 'Draft excerpt...' ? '' : (fetchedPost.excerpt || ''));
      setKeywords(fetchedPost.seoKeywords || '');
      setCanvasBlocks(parseHtmlToBlocks(fetchedPost.htmlContent || ''));
      
      const metadataBlocks: MetadataBlockType[] = [];
      if (fetchedPost.category && fetchedPost.category !== 'Other') metadataBlocks.push('category');
      if (fetchedPost.coverImage) metadataBlocks.push('coverImage');
      if (fetchedPost.excerpt && fetchedPost.excerpt !== 'Draft excerpt...') metadataBlocks.push('excerpt');
      if (fetchedPost.seoKeywords) metadataBlocks.push('keywords');
      setActiveBlocks(metadataBlocks);

      lastSavedRef.current = JSON.stringify({
        title: fetchedPost.title || '',
        category: fetchedPost.category || '',
        coverImage: fetchedPost.coverImage || '',
        excerpt: fetchedPost.excerpt || '',
        keywords: fetchedPost.seoKeywords || '',
        content: fetchedPost.htmlContent || '',
      });
      setSyncStatus('saved');
      setLoadingPost(false);
    } else if (fetchError) {
      setErrors({ submit: fetchError.message || 'Failed to load article draft.' });
      setLoadingPost(false);
    }
  }, [fetchedPost, fetchError]);

  // Restore offline draft if editing new article
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('id')) {
        const savedDraft = localStorage.getItem('writen_offline_draft');
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            if (draft.title || draft.content) {
              const confirmRestore = window.confirm('We found an unsaved draft in your browser. Would you like to restore it?');
              if (confirmRestore) {
                setPostId(draft.postId ?? null);
                setTitle(draft.title ?? '');
                setCategory(draft.category ?? '');
                setCoverImage(draft.coverImage ?? '');
                setExcerpt(draft.excerpt ?? '');
                setKeywords(draft.keywords ?? '');
                setCanvasBlocks(draft.canvasBlocks || [{ id: 'restored_content', type: 'content', value: draft.content }]);
                setActiveBlocks(draft.activeBlocks ?? []);
                lastSavedRef.current = JSON.stringify({
                  title: draft.title, category: draft.category, coverImage: draft.coverImage,
                  excerpt: draft.excerpt, keywords: draft.keywords, content: draft.content || '',
                });
                setSyncStatus('saved');
              } else {
                localStorage.removeItem('writen_offline_draft');
              }
            }
          } catch (e) {
            console.error('Error restoring draft:', e);
          }
        }
      }
    }
  }, []);

  // Memos
  const slug = useMemo(() => slugify(title), [title]);
  const keywordChips = useMemo(() => keywords.split(',').map(k => k.trim()).filter(Boolean), [keywords]);
  const readingTime = useMemo(() => {
    const text = compileCanvasBlocks(canvasBlocks).replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [canvasBlocks]);

  const isWorkspaceCompletelyEmpty = (): boolean => {
    const hasAnyBlockContent = canvasBlocks.some(b => b.value.trim());
    return !title.trim() && !coverImage.trim() && !excerpt.trim() && !keywords.trim() && (!category.trim() || category === 'Other') && !hasAnyBlockContent;
  };

  // Mutations
  const createPostMutation = useCreatePostMutation(accessToken);
  const updatePostMutation = useUpdatePostMutation(accessToken);

  const savePost = async (status: 'DRAFT' | 'PUBLISHED') => {
    const compiledContent = compileCanvasBlocks(canvasBlocks);
    const payload = {
      title: title.trim() || (status === 'DRAFT' ? 'Untitled Draft' : ''),
      htmlContent: compiledContent,
      category: category || 'Other',
      excerpt: excerpt || (status === 'DRAFT' ? 'Draft excerpt...' : ''),
      coverImage,
      seoKeywords: keywords,
      status,
    };

    if (postId) {
      return updatePostMutation.mutateAsync({ id: postId, payload });
    } else {
      const result = await createPostMutation.mutateAsync(payload);
      if (result?.data?._id) setPostId(result.data._id);
      return result;
    }
  };

  const autoSaveDraft = async () => {
    if (publishing || createPostMutation.isPending || updatePostMutation.isPending) return;
    if (!postId && isWorkspaceCompletelyEmpty()) return;

    const compiledContent = compileCanvasBlocks(canvasBlocks);
    const currentPayload = JSON.stringify({ title, category, coverImage, excerpt, keywords, content: compiledContent });
    if (currentPayload === lastSavedRef.current) return;

    setSyncStatus('saving');
    if (typeof window !== 'undefined') {
      localStorage.setItem('writen_offline_draft', JSON.stringify({ postId, title, category, coverImage, excerpt, keywords, canvasBlocks, activeBlocks }));
    }

    try {
      const result = await savePost('DRAFT');
      if (result?.success) {
        lastSavedRef.current = currentPayload;
        setSyncStatus('saved');
        if (typeof window !== 'undefined') {
          localStorage.setItem('writen_offline_draft', JSON.stringify({ postId: result.data?._id || postId, title, category, coverImage, excerpt, keywords, canvasBlocks, activeBlocks }));
        }
      } else {
        setSyncStatus('offline_saved');
      }
    } catch (err) {
      setSyncStatus('offline_saved');
    }
  };

  // Auto-Save Timer
  useEffect(() => {
    if (loadingPost || publishing || createPostMutation.isPending || updatePostMutation.isPending) return;
    if (!postId && isWorkspaceCompletelyEmpty()) return;

    const timer = setTimeout(() => {
      autoSaveDraft();
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, category, coverImage, excerpt, keywords, canvasBlocks, publishing, postId, loadingPost]);

  const handleSaveDraft = async () => {
    if (syncStatus === 'saving' || createPostMutation.isPending || updatePostMutation.isPending) return;
    if (!postId && isWorkspaceCompletelyEmpty()) return;
    setSyncStatus('saving');

    const compiledContent = compileCanvasBlocks(canvasBlocks);
    const currentPayload = JSON.stringify({ title, category, coverImage, excerpt, keywords, content: compiledContent });

    try {
      const result = await savePost('DRAFT');
      if (result?.success) {
        lastSavedRef.current = currentPayload;
        setSyncStatus('saved');
        setShowManualSavedTick(true);
        setTimeout(() => setShowManualSavedTick(false), 2000);
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      setSyncStatus('offline_saved');
      setShowManualSavedTick(true);
      setTimeout(() => setShowManualSavedTick(false), 2000);
    }
  };

  const handlePublish = async () => {
    if (publishing || createPostMutation.isPending || updatePostMutation.isPending) return;
    if (!validate()) return;
    setPublishing(true);
    setSyncStatus('saving');

    try {
      const result = await savePost('PUBLISHED');
      if (result?.success) {
        setCreatedPost(result.data);
        setShowPreview(true);
        setSyncStatus('saved');
        if (typeof window !== 'undefined') localStorage.removeItem('writen_offline_draft');
        if (result.roleUpgraded) await refreshUser();
      } else {
        setSyncStatus('error');
        setErrors({ submit: result.message || 'Failed to publish post.' });
      }
    } catch (err: any) {
      setSyncStatus('error');
      setErrors({ submit: err.message || 'An unexpected connection error occurred.' });
    } finally {
      setPublishing(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    else if (title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters';
    else if (title.trim().length > 200) newErrors.title = 'Title cannot exceed 200 characters';

    ['category', 'coverImage', 'excerpt', 'keywords'].forEach((req: any) => {
      if (!activeBlocks.includes(req)) newErrors[`block_${req}`] = `Workspace requires the ${req} block.`;
    });

    if (activeBlocks.includes('category') && !category) newErrors.category = 'Please select a category';
    if (activeBlocks.includes('coverImage') && !coverImage.trim()) newErrors.coverImage = 'Cover image URL is required';
    if (activeBlocks.includes('excerpt') && !excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
    if (activeBlocks.includes('keywords') && !keywords.trim()) newErrors.keywords = 'SEO keywords are required';

    const textOnly = compileCanvasBlocks(canvasBlocks).replace(/<[^>]*>/g, '').trim();
    if (!textOnly) newErrors.canvas = 'Writing canvas content is required.';
    else if (textOnly.length < 15) newErrors.canvas = 'Content must be at least 15 characters';

    canvasBlocks.forEach((block, idx) => {
      if (block.type === 'image_block' && !block.value.trim()) {
        newErrors[`block_${block.id}`] = `Image Block #${idx + 1} has no image config.`;
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.title) titleInputRef.current?.focus();
      return false;
    }
    return true;
  };

  const handleMetadataBlockAction = (blockType: MetadataBlockType) => {
    if (activeBlocks.includes(blockType)) {
      const el = document.getElementById(`block-card-${blockType}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary/45');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary/45'), 1500);
      }
      return;
    }
    setActiveBlocks([...activeBlocks, blockType]);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface relative pb-32">
      <WriteBar
        syncStatus={syncStatus}
        publishing={publishing}
        loadingPost={loadingPost}
        showManualSavedTick={showManualSavedTick}
        user={user}
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
      />

      <main className="flex-1 max-w-[720px] w-full mx-auto px-6 py-12 flex flex-col relative">
        {loadingPost ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 select-none">
            <span className="material-symbols-outlined animate-spin text-primary text-[44px]">progress_activity</span>
            <p className="font-label-caps text-xs text-on-surface-variant font-bold tracking-widest uppercase animate-pulse">Retrieving story draft...</p>
          </div>
        ) : (
          <>
            {errors.submit && (
              <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-xl flex items-start gap-3 select-none">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                <p className="text-sm text-error font-medium">{errors.submit}</p>
              </div>
            )}

            <div className="mb-4">
              <input
                ref={titleInputRef}
                type="text"
                id="title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-transparent font-headline-lg text-4xl md:text-5xl font-bold text-on-surface placeholder:text-outline-variant/40 outline-none border-none leading-tight py-2 font-display-xl"
              />
              {slug && (
                <p className="font-code-sm text-xs text-on-surface-variant/80 mt-1 flex items-center gap-1.5 font-mono select-none">
                  <span className="material-symbols-outlined text-[14px] text-primary">link</span>
                  writen.com/blog/<span className="text-primary font-medium">{slug}</span>
                </p>
              )}
              {errors.title && <p className="text-error text-xs font-medium mt-1 select-none">{errors.title}</p>}
            </div>

            <div className="space-y-6 mb-8">
              {activeBlocks.map((block) => (
                <MetadataBlockCard
                  key={block}
                  block={block}
                  category={category}
                  setCategory={setCategory}
                  categoriesList={categoriesList}
                  coverImage={coverImage}
                  setCoverImage={setCoverImage}
                  accessToken={accessToken}
                  excerpt={excerpt}
                  setExcerpt={setExcerpt}
                  keywords={keywords}
                  setKeywords={setKeywords}
                  keywordChips={keywordChips}
                  errors={errors}
                  setErrors={setErrors}
                  onDelete={() => {
                    setActiveBlocks(activeBlocks.filter(b => b !== block));
                    setErrors(prev => { const next = { ...prev }; delete next[block]; delete next[`block_${block}`]; return next; });
                  }}
                />
              ))}
            </div>

            <EditorCanvas
              canvasBlocks={canvasBlocks}
              activeBlocks={activeBlocks}
              accessToken={accessToken}
              errors={errors}
              updateCanvasBlock={(id, updates) => setCanvasBlocks(canvasBlocks.map(b => b.id === id ? { ...b, ...updates } : b))}
              moveCanvasBlock={(index, direction) => {
                const nextBlocks = [...canvasBlocks];
                const targetIdx = direction === 'up' ? index - 1 : index + 1;
                if (targetIdx < 0 || targetIdx >= nextBlocks.length) return;
                const temp = nextBlocks[index];
                nextBlocks[index] = nextBlocks[targetIdx];
                nextBlocks[targetIdx] = temp;
                setCanvasBlocks(nextBlocks);
              }}
              deleteCanvasBlock={(id) => setCanvasBlocks(canvasBlocks.filter(b => b.id !== id))}
              onAddCanvasBlock={(type) => setCanvasBlocks([...canvasBlocks, { id: `${type}_${Math.random().toString(36).slice(2, 9)}`, type, value: '', caption: '', language: 'javascript' }])}
              onAddMetadataBlock={handleMetadataBlockAction}
            />

            {Object.keys(errors).some(k => k.startsWith('block_')) && (
              <div className="my-6 p-4 bg-error-container/20 border border-error/20 rounded-xl space-y-2 select-none">
                <p className="text-xs uppercase font-label-caps text-error tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Missing or Invalid Elements
                </p>
                <ul className="text-xs text-on-surface-variant space-y-1 pl-4 list-disc font-body-md">
                  {Object.keys(errors).map((k) => k.startsWith('block_') ? <li key={k} className="text-error/90 font-medium">{errors[k]}</li> : null)}
                </ul>
              </div>
            )}
          </>
        )}
      </main>

      <PreviewOverlay
        showPreview={showPreview}
        canvasBlocks={canvasBlocks}
        category={category}
        title={title}
        coverImage={coverImage}
        excerpt={excerpt}
        keywordChips={keywordChips}
        readingTime={readingTime}
        user={user}
        onClose={() => setShowPreview(false)}
        onExit={() => router.push('/feed')}
      />
    </div>
  );
}

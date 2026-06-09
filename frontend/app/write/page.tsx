'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

import WriteBar from '@/components/write/WriteBar';
import PreviewOverlay from '@/components/write/PreviewOverlay';
import EditorCanvas from '@/components/write/EditorCanvas';
import { MetadataBlockCard, MetadataBlockType, CanvasBlock } from '@/components/write/CanvasBlocks';

import { useCategoriesQuery, usePostDetailQuery } from '@/hooks/usePosts';
import { slugify, compileCanvasBlocks, parseHtmlToBlocks } from '@/components/write/write-utils';
import { validatePost } from '@/components/write/validation';
import { useAutoSave } from '@/components/write/useAutoSave';

const DEFAULT_CATEGORIES = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
  'System Design', 'DevOps', 'Databases', 'Cloud & AWS', 'Security',
  'Algorithms & DSA', 'Career & Growth', 'Open Source', 'Other'
];

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

  const [loadingPost, setLoadingPost] = useState(false);
  const [urlPostId, setUrlPostId] = useState<string | null>(null);

  // ── Categories query ──
  const { data: fetchedCategories } = useCategoriesQuery();
  const categoriesList = fetchedCategories || DEFAULT_CATEGORIES;

  const isWorkspaceCompletelyEmpty = (): boolean => {
    const hasAnyBlockContent = canvasBlocks.some(b => b.value.trim());
    return !title.trim() && !coverImage.trim() && !excerpt.trim() && !keywords.trim() && (!category.trim() || category === 'Other') && !hasAnyBlockContent;
  };

  // ── Auto Save Hook ──
  const {
    postId,
    setPostId,
    syncStatus,
    setSyncStatus,
    showManualSavedTick,
    lastSavedRef,
    savePost,
    handleSaveDraft,
    createPostMutation,
    updatePostMutation,
  } = useAutoSave({
    title,
    category,
    coverImage,
    excerpt,
    keywords,
    canvasBlocks,
    activeBlocks,
    publishing,
    loadingPost,
    accessToken,
    isWorkspaceEmpty: isWorkspaceCompletelyEmpty,
  });

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

  const handleQuit = () => {
    const hasAnyContent = title.trim() || canvasBlocks.some(b => b.value.trim());
    if (hasAnyContent) {
      const confirmQuit = window.confirm("Are you sure you want to quit? Any unsaved changes in this session will be lost.");
      if (!confirmQuit) return;
    }
    
    // Clear local workspace cache on explicit quit
    if (typeof window !== 'undefined') {
      localStorage.removeItem('writen_offline_draft');
    }
    
    router.push('/feed');
  };

  const handlePublish = async () => {
    if (publishing || createPostMutation.isPending || updatePostMutation.isPending) return;
    
    const newErrors = validatePost({
      title,
      category,
      coverImage,
      excerpt,
      keywords,
      activeBlocks,
      canvasBlocks,
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.title) titleInputRef.current?.focus();
      return;
    }

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
        onQuit={handleQuit}
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

            {/* ── Publish Validation Checklist ────────────────────────────────────
                Shows when there are any errors (block missing, canvas empty, etc.)
                Uses plain language so any user can understand what to fix.
            */}
            {Object.keys(errors).some(k => k.startsWith('block_') || k === 'canvas') && (
              <div className="my-6 p-5 bg-error-container/15 border border-error/25 rounded-2xl select-none space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[20px]">checklist</span>
                  <p className="text-sm font-semibold text-error">
                    A few things are needed before you can publish:
                  </p>
                </div>
                <ul className="space-y-2">
                  {/* Canvas / body error */}
                  {errors.canvas && (
                    <li className="flex items-start gap-2.5 text-sm">
                      <span className="material-symbols-outlined text-[16px] text-error shrink-0 mt-0.5">edit_note</span>
                      <span className="text-on-surface-variant font-medium">{errors.canvas}</span>
                    </li>
                  )}
                  {/* Missing metadata blocks */}
                  {(['block_category', 'block_coverImage', 'block_excerpt', 'block_keywords'] as const).map(key =>
                    errors[key] ? (
                      <li key={key} className="flex items-start gap-2.5 text-sm">
                        <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">add_circle</span>
                        <span className="text-on-surface-variant font-medium">
                          {errors[key]}
                          <span className="ml-1.5 text-xs text-on-surface-variant/60 font-normal">(click&nbsp;+ Add below to add it)</span>
                        </span>
                      </li>
                    ) : null
                  )}
                  {/* Empty image blocks */}
                  {Object.keys(errors)
                    .filter(k => k.startsWith('block_') && !['block_category','block_coverImage','block_excerpt','block_keywords'].includes(k))
                    .map(k => (
                      <li key={k} className="flex items-start gap-2.5 text-sm">
                        <span className="material-symbols-outlined text-[16px] text-error shrink-0 mt-0.5">image</span>
                        <span className="text-on-surface-variant font-medium">{errors[k]}</span>
                      </li>
                    ))
                  }
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

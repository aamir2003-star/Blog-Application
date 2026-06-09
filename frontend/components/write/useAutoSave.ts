import { useState, useRef, useEffect } from 'react';
import { useCreatePostMutation, useUpdatePostMutation } from '@/hooks/usePosts';
import { CanvasBlock, MetadataBlockType } from './CanvasBlocks';
import { compileCanvasBlocks } from './write-utils';

interface UseAutoSaveParams {
  title: string;
  category: string;
  coverImage: string;
  excerpt: string;
  keywords: string;
  canvasBlocks: CanvasBlock[];
  activeBlocks: MetadataBlockType[];
  publishing: boolean;
  loadingPost: boolean;
  accessToken: string | null;
  isWorkspaceEmpty: () => boolean;
}

export function useAutoSave({
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
  isWorkspaceEmpty,
}: UseAutoSaveParams) {
  const [postId, setPostId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'offline_saved' | 'error'>('idle');
  const [showManualSavedTick, setShowManualSavedTick] = useState(false);
  const lastSavedRef = useRef<string>('');

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
    if (!postId && isWorkspaceEmpty()) return;

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
    if (!postId && isWorkspaceEmpty()) return;

    const timer = setTimeout(() => {
      autoSaveDraft();
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, category, coverImage, excerpt, keywords, canvasBlocks, publishing, postId, loadingPost]);

  const handleSaveDraft = async () => {
    if (syncStatus === 'saving' || createPostMutation.isPending || updatePostMutation.isPending) return;
    if (!postId && isWorkspaceEmpty()) return;
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

  return {
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
  };
}

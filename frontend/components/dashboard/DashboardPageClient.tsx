'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

// Import custom React Query hooks
import {
  useMyPostsQuery,
  useTrashPostsQuery,
  useRestorePostMutation,
  usePermanentDeleteMutation,
  useUpdateSettingsMutation,
} from '@/hooks/useDashboard';
import {
  useDeletePostMutation,
  useToggleStatusMutation,
  useRequestDeleteOtpMutation,
} from '@/hooks/usePosts';

// Import modular dashboard components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AnalyticsSummary from '@/components/dashboard/AnalyticsSummary';
import SettingsToggle from '@/components/dashboard/SettingsToggle';
import ActivePublicationsTable from '@/components/dashboard/ActivePublicationsTable';
import TrashedPublicationsTable from '@/components/dashboard/TrashedPublicationsTable';
import DeleteOtpModal from '@/components/dashboard/DeleteOtpModal';

interface DashboardPageClientProps {
  initialMyPosts: any;
  initialTrashPosts: any;
}

export default function DashboardPageClient({
  initialMyPosts,
  initialTrashPosts,
}: DashboardPageClientProps) {
  const { user, accessToken } = useAuth();

  // ── States ──
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [deletingPost, setDeletingPost] = useState<any | null>(null);
  const [transitioningDeleteIds, setTransitioningDeleteIds] = useState<string[]>([]);
  
  // OTP Verification States
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [autoDeleteTrashSetting, setAutoDeleteTrashSetting] = useState(true);
  const [permanentlyDeletingPost, setPermanentlyDeletingPost] = useState<any | null>(null);

  // Sync user preference settings
  useEffect(() => {
    if (user) {
      setAutoDeleteTrashSetting(user.autoDeleteTrash !== false);
    }
  }, [user]);

  // Clear transition states when switching tabs
  useEffect(() => {
    setTransitioningDeleteIds([]);
  }, [viewMode]);

  // ── React Query Queries (Warmed with server data) ──
  const { 
    data: myPostsData, 
    isLoading: activeLoading, 
    error: activeError 
  } = useMyPostsQuery(accessToken, initialMyPosts);

  const { 
    data: trashPostsData, 
    isLoading: trashLoading, 
    error: trashError 
  } = useTrashPostsQuery(accessToken, initialTrashPosts);

  // ── React Query Mutations ──
  const toggleStatusMutation = useToggleStatusMutation(accessToken);
  const requestDeleteOtpMutation = useRequestDeleteOtpMutation(accessToken);
  const deletePostMutation = useDeletePostMutation(accessToken);
  const restorePostMutation = useRestorePostMutation(accessToken);
  const permanentDeleteMutation = usePermanentDeleteMutation(accessToken);
  const updateSettingsMutation = useUpdateSettingsMutation(accessToken);

  // ── Event Handlers ──
  const handleToggleStatus = (postId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    toggleStatusMutation.mutate({ id: postId, nextStatus }, {
      onError: (err: any) => alert(err.message || 'Failed to update post status.'),
    });
  };

  const handleRequestOtp = () => {
    if (!deletingPost) return;
    setOtpError(null);
    requestDeleteOtpMutation.mutate(deletingPost._id, {
      onSuccess: () => setShowOtpInput(true),
      onError: (err: any) => setOtpError(err.message || 'Failed to send verification code.'),
    });
  };

  const handleDeletePost = () => {
    if (!deletingPost) return;
    const targetId = deletingPost._id;
    const isPublished = deletingPost.status === 'PUBLISHED';
    
    if (isPublished && !otpCode) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setTransitioningDeleteIds(prev => [...prev, targetId]);
    setDeletingPost(null);
    setShowOtpInput(false);

    deletePostMutation.mutate({ id: targetId, otpCode }, {
      onSuccess: () => {
        setOtpCode('');
        setOtpError(null);
      },
      onError: (err: any) => {
        setTransitioningDeleteIds(prev => prev.filter(id => id !== targetId));
        alert(err.message || 'Failed to delete post.');
      },
    });
  };

  const handleRestorePost = (postId: string) => {
    restorePostMutation.mutate(postId, {
      onError: (err: any) => alert(err.message || 'Failed to restore article.'),
    });
  };

  const handlePermanentDelete = () => {
    if (!permanentlyDeletingPost) return;
    permanentDeleteMutation.mutate(permanentlyDeletingPost._id, {
      onSuccess: () => setPermanentlyDeletingPost(null),
      onError: (err: any) => alert(err.message || 'Failed to purge publication.'),
    });
  };

  const handleToggleAutoDelete = () => {
    const nextVal = !autoDeleteTrashSetting;
    updateSettingsMutation.mutate(nextVal, {
      onSuccess: () => setAutoDeleteTrashSetting(nextVal),
      onError: (err: any) => alert(err.message || 'Failed to update settings.'),
    });
  };

  const posts = myPostsData?.data || [];
  const analytics = myPostsData?.analytics || { totalViews: 0, publishedCount: 0, draftsCount: 0 };
  const trashPosts = trashPostsData?.data || [];
  const error = activeError?.message || trashError?.message || null;

  return (
    <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto px-4 md:px-6 py-10">
      <main className="w-full flex flex-col gap-8 min-h-[calc(100vh-57px)]">
        <DashboardHeader viewMode={viewMode} setViewMode={setViewMode} />

        {error && (
          <div className="p-4 bg-error-container/20 border border-error/30 rounded-2xl flex items-start gap-3 select-none">
            <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
            <p className="text-sm text-error font-medium">{error}</p>
          </div>
        )}

        <AnalyticsSummary loading={activeLoading} analytics={analytics} />

        {viewMode === 'active' ? (
          <ActivePublicationsTable
            posts={posts}
            loading={activeLoading}
            togglingId={toggleStatusMutation.isPending ? toggleStatusMutation.variables?.id : null}
            transitioningDeleteIds={transitioningDeleteIds}
            onToggleStatus={handleToggleStatus}
            onDeleteRequest={setDeletingPost}
          />
        ) : (
          <>
            <SettingsToggle
              autoDeleteTrashSetting={autoDeleteTrashSetting}
              togglingAutoDelete={updateSettingsMutation.isPending}
              onToggle={handleToggleAutoDelete}
            />
            <TrashedPublicationsTable
              trashPosts={trashPosts}
              loading={trashLoading}
              restoringId={restorePostMutation.isPending ? restorePostMutation.variables : null}
              onRestore={handleRestorePost}
              onPermanentDeleteRequest={setPermanentlyDeletingPost}
            />
          </>
        )}
      </main>

      <DeleteOtpModal
        deletingPost={deletingPost}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        otpError={otpError}
        setOtpError={setOtpError}
        sendingOtp={requestDeleteOtpMutation.isPending}
        deleting={deletePostMutation.isPending}
        showOtpInput={showOtpInput}
        setShowOtpInput={setShowOtpInput}
        onRequestOtp={handleRequestOtp}
        onConfirmDelete={handleDeletePost}
        onCancel={() => setDeletingPost(null)}
      />

      {permanentlyDeletingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 max-w-sm w-full rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-error select-none">
                <div className="p-2.5 bg-error/10 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">delete_forever</span>
                </div>
                <h3 className="font-headline-lg text-lg font-bold text-on-surface">Purge Permanently</h3>
              </div>

              <div className="space-y-2">
                <p className="font-body-md text-sm text-on-surface leading-normal">
                  Are you absolutely certain you want to permanently delete **"{permanentlyDeletingPost.title}"**?
                </p>
                <p className="font-body-md text-xs text-error font-medium leading-relaxed bg-error/5 p-3 rounded-xl border border-error/10 select-none">
                  ⚠️ This action is irreversible. The document will be immediately purged from our servers, and all database backups, views, and analytics cannot be recovered.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 select-none">
                <button
                  onClick={() => setPermanentlyDeletingPost(null)}
                  disabled={permanentDeleteMutation.isPending}
                  className="font-label-caps text-xs text-on-surface-variant hover:text-on-surface px-4 py-2.5 rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-all font-semibold cursor-pointer disabled:opacity-50 focus:outline-none bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={permanentDeleteMutation.isPending}
                  className="bg-error text-on-error font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-error/90 transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus:outline-none border-none"
                >
                  {permanentDeleteMutation.isPending ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  ) : null}
                  Purge Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

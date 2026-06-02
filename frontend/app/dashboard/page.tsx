'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CreatorDashboard() {
  const { user, accessToken } = useAuth();
  const router = useRouter();

  // ── States ──
  const [posts, setPosts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({ totalViews: 0, publishedCount: 0, draftsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [transitioningDeleteIds, setTransitioningDeleteIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── Strict Security Redirect ──
  useEffect(() => {
    // Redirect if clearly not authorized
    if (user === null) {
      router.replace('/login');
    } else if (user && user.role !== 'CREATOR') {
      router.replace('/feed');
    }
  }, [user, router]);

  // ── Fetch Portfolio Data ──
  const fetchDashboardData = async () => {
    if (!accessToken) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/posts/my`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const resData = await res.json();

      if (resData.success) {
        setPosts(resData.data || []);
        if (resData.analytics) {
          setAnalytics(resData.analytics);
        }
      } else {
        setError(resData.message || 'Failed to fetch portfolio data.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure. Make sure the backend server is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'CREATOR' && accessToken) {
      fetchDashboardData();
    }
  }, [user, accessToken]);

  // ── Toggle Draft/Published Status ──
  const handleToggleStatus = async (postId: string, currentStatus: string) => {
    if (togglingId) return;
    setTogglingId(postId);

    const nextStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const resData = await res.json();

      if (resData.success) {
        // Update local posts list state
        setPosts(prev =>
          prev.map(p => (p._id === postId ? { ...p, status: nextStatus } : p))
        );
        // Adjust aggregate analytics count dynamically
        setAnalytics(prev => ({
          ...prev,
          publishedCount: prev.publishedCount + (nextStatus === 'PUBLISHED' ? 1 : -1),
          draftsCount: prev.draftsCount + (nextStatus === 'DRAFT' ? 1 : -1),
        }));
      } else {
        alert(resData.message || 'Failed to update post status.');
      }
    } catch (err) {
      console.error(err);
      alert('Network issue. Failed to connect to server.');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete Post Trigger ──
  const handleDeletePost = async () => {
    if (!deletingPost || deleting) return;
    setDeleting(true);

    const targetId = deletingPost._id;

    // Trigger row fade-out slide transition immediately
    setTransitioningDeleteIds(prev => [...prev, targetId]);
    setDeletingPost(null);

    // Give 500ms for visual transition to complete before removing from state
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/posts/${targetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const resData = await res.json();

        if (resData.success) {
          // Adjust overall analytics counters
          setAnalytics(prev => ({
            ...prev,
            totalViews: prev.totalViews - (deletingPost.views || 0),
            publishedCount: prev.publishedCount - (deletingPost.status === 'PUBLISHED' ? 1 : 0),
            draftsCount: prev.draftsCount - (deletingPost.status === 'DRAFT' ? 1 : 0),
          }));
          // Remove from local array
          setPosts(prev => prev.filter(p => p._id !== targetId));
        } else {
          // Restore row state if failed
          setTransitioningDeleteIds(prev => prev.filter(id => id !== targetId));
          alert(resData.message || 'Failed to delete post.');
        }
      } catch (err) {
        console.error(err);
        setTransitioningDeleteIds(prev => prev.filter(id => id !== targetId));
        alert('Network failure occurred. Post was not deleted.');
      } finally {
        setDeleting(false);
      }
    }, 500);
  };

  // ── loading state check ──
  if (!user || user.role !== 'CREATOR') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-primary/5 blur-3xl select-none pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-primary/5 blur-3xl select-none pointer-events-none" />
        
        <div className="flex flex-col items-center gap-4 z-10">
          <span className="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
          <p className="font-label-caps text-xs text-on-surface-variant font-semibold uppercase tracking-wider animate-pulse select-none">
            Verifying credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col relative font-body-md text-on-surface">
      <TopNavBar />

      <div className="flex-1 flex w-full">
        <SideNavBar />

        {/* Wider Canvas optimized for portfolio data lists */}
        <div className="flex-1 flex justify-center pl-16 pr-6 py-10 md:pl-16 md:pr-8 transition-all duration-[450ms] ease-in-out">
          <main className="flex-1 max-w-[1000px] w-full flex flex-col gap-8 min-h-[calc(100vh-57px)]">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-outline-variant/20">
              <div>
                <h1 className="font-display-xl text-3xl md:text-4xl font-bold tracking-tight text-on-surface leading-tight">
                  Creator Space
                </h1>
                <p className="font-body-md text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                  Analyze performance metrics and manage your published publications catalog.
                </p>
              </div>

              <Link
                href="/write"
                className="bg-primary text-on-primary font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit_square</span>
                Write New Story
              </Link>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="p-4 bg-error-container/20 border border-error/30 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            )}

            {/* Analytics Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* Metric 1: Views */}
              <div className="bg-surface-container-lowest border border-outline-variant/15 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 blur-xl group-hover:scale-110 transition-transform select-none pointer-events-none" />
                <div className="space-y-1">
                  <span className="font-label-caps text-[10px] tracking-wider text-on-surface-variant font-semibold uppercase">Total Story Views</span>
                  <p className="text-3xl font-bold text-on-surface font-sans leading-none tracking-tight">
                    {loading ? '—' : analytics.totalViews.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">visibility</span>
                </div>
              </div>

              {/* Metric 2: Published */}
              <div className="bg-surface-container-lowest border border-outline-variant/15 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 blur-xl group-hover:scale-110 transition-transform select-none pointer-events-none" />
                <div className="space-y-1">
                  <span className="font-label-caps text-[10px] tracking-wider text-on-surface-variant font-semibold uppercase">Published Articles</span>
                  <p className="text-3xl font-bold text-on-surface font-sans leading-none tracking-tight">
                    {loading ? '—' : analytics.publishedCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">public</span>
                </div>
              </div>

              {/* Metric 3: Drafts */}
              <div className="bg-surface-container-lowest border border-outline-variant/15 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-tertiary/5 rounded-full translate-x-8 -translate-y-8 blur-xl group-hover:scale-110 transition-transform select-none pointer-events-none" />
                <div className="space-y-1">
                  <span className="font-label-caps text-[10px] tracking-wider text-on-surface-variant font-semibold uppercase">Unpublished Drafts</span>
                  <p className="text-3xl font-bold text-on-surface font-sans leading-none tracking-tight">
                    {loading ? '—' : analytics.draftsCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-tertiary/10 rounded-2xl text-tertiary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
              </div>

            </div>

            {/* Articles Table section */}
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Your Article Publications ({posts.length})
                </h2>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-16 flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-primary text-[28px]">progress_activity</span>
                    <span className="font-label-caps text-xs text-on-surface-variant font-semibold tracking-wider">Syncing database data...</span>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <span className="material-symbols-outlined text-outline-variant text-[44px] select-none">article</span>
                    <p className="font-body-md text-base font-bold text-on-surface-variant">No publications found</p>
                    <p className="font-body-md text-xs text-outline leading-relaxed max-w-sm mx-auto">
                      You haven't authored any publications yet. Click "Write New Story" above to draft your technical masterpiece!
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                        <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider">Article Title</th>
                        <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[120px]">Category</th>
                        <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[100px] text-center">Views</th>
                        <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[140px]">Last Updated</th>
                        <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[130px] text-center">Status</th>
                        <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[100px] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {posts.map((post) => {
                        const isTransitioning = transitioningDeleteIds.includes(post._id);

                        return (
                          <tr
                            key={post._id}
                            className={`hover:bg-surface-container-low/20 transition-all duration-500 origin-center ${
                              isTransitioning 
                                ? 'opacity-0 scale-95 max-h-0 py-0 border-none overflow-hidden select-none pointer-events-none bg-error-container/10' 
                                : ''
                            }`}
                          >
                            {/* Column 1: Title & Excerpt */}
                            <td className="px-6 py-4.5 min-w-[280px]">
                              <div className="flex flex-col gap-1">
                                <span className="font-headline-lg text-base font-bold text-on-surface line-clamp-1 hover:text-primary transition-colors leading-tight">
                                  {post.title}
                                </span>
                                <span className="font-body-md text-xs text-on-surface-variant line-clamp-1 leading-normal">
                                  {post.excerpt || 'No summary description provided.'}
                                </span>
                              </div>
                            </td>

                            {/* Column 2: Category */}
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="px-2.5 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full font-label-caps border border-primary/10 font-bold tracking-wider">
                                {post.category || 'Uncategorized'}
                              </span>
                            </td>

                            {/* Column 3: Views stats */}
                            <td className="px-6 py-4.5 whitespace-nowrap text-center">
                              <span className="font-body-md text-sm text-on-surface-variant font-medium flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-[15px] text-outline-variant select-none">visibility</span>
                                {(post.views || 0).toLocaleString()}
                              </span>
                            </td>

                            {/* Column 4: Last Updated */}
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="font-body-md text-xs text-on-surface-variant font-medium">
                                {formatRelativeTime(post.updatedAt)}
                              </span>
                            </td>

                            {/* Column 5: Status Slider Switch */}
                            <td className="px-6 py-4.5 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleToggleStatus(post._id, post.status)}
                                  disabled={togglingId === post._id}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 select-none ${
                                    post.status === 'PUBLISHED' ? 'bg-primary' : 'bg-outline-variant/50'
                                  }`}
                                  title={`Switch to ${post.status === 'PUBLISHED' ? 'Draft' : 'Publish'}`}
                                >
                                  <span
                                    className={`pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                      post.status === 'PUBLISHED' ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  >
                                    {togglingId === post._id && (
                                      <span className="material-symbols-outlined animate-spin text-[10px] text-primary">progress_activity</span>
                                    )}
                                  </span>
                                </button>
                                <span
                                  className={`font-label-caps text-[10px] uppercase font-bold tracking-wider select-none w-14 text-left ${
                                    post.status === 'PUBLISHED' ? 'text-primary' : 'text-on-surface-variant/80'
                                  }`}
                                >
                                  {post.status}
                                </span>
                              </div>
                            </td>

                            {/* Column 6: Actions */}
                            <td className="px-6 py-4.5 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/write?id=${post._id}`}
                                  className="p-1.5 hover:bg-surface-container-low text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer active:scale-90"
                                  title="Edit publication"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </Link>
                                <button
                                  onClick={() => setDeletingPost(post)}
                                  className="p-1.5 hover:bg-error-container/20 text-on-surface-variant hover:text-error rounded-lg transition-colors cursor-pointer active:scale-90"
                                  title="Delete publication"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ─── 🗑️ HIGH-FIDELITY DANGER CONFIRMATION MODAL ─── */}
      {deletingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 max-w-sm w-full rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              
              {/* Modal Warning Header */}
              <div className="flex items-center gap-3 text-error">
                <div className="p-2.5 bg-error/10 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <h3 className="font-headline-lg text-lg font-bold text-on-surface">Delete Publication</h3>
              </div>

              {/* Warning Content description */}
              <div className="space-y-1.5">
                <p className="font-body-md text-sm text-on-surface leading-normal">
                  Are you absolutely sure you want to delete **"{deletingPost.title}"**?
                </p>
                <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                  This action is permanent and cannot be undone. All stories data, SEO configurations, and statistics will be wiped from our database.
                </p>
              </div>

              {/* Action layout buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setDeletingPost(null)}
                  disabled={deleting}
                  className="font-label-caps text-xs text-on-surface-variant hover:text-on-surface px-4 py-2.5 rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-all font-semibold cursor-pointer disabled:opacity-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={deleting}
                  className="bg-error text-on-error font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-error/90 transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus:outline-none"
                >
                  {deleting ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  ) : null}
                  Delete Post
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

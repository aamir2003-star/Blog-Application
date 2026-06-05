'use client';

import { useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import ArticleContent from '@/components/feed/ArticleContent';
import { usePostDetailQuery } from '@/hooks/usePosts';
import { useToggleBookmarkMutation } from '@/hooks/useBookmarks';
import { useRecordViewMutation, useRecordReadMutation } from '@/hooks/useAnalytics';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { accessToken, loading: authLoading } = useAuth();

  // ── React Query Queries & Mutations ──
  const { data: post, isLoading: loading, error } = usePostDetailQuery(slug, accessToken);
  const toggleBookmarkMutation = useToggleBookmarkMutation(accessToken);
  const recordViewMutation = useRecordViewMutation(accessToken);
  const recordReadMutation = useRecordReadMutation(accessToken);

  const viewTracked = useRef<string | null>(null);

  // ── Telemetry Effects (View & Read) ──
  useEffect(() => {
    if (authLoading) return;
    if (!post?._id) return;

    if (viewTracked.current === post._id) return;
    viewTracked.current = post._id;

    // Generate or retrieve persistent visitor ID
    let visitorId = localStorage.getItem('writen_visitor_uuid');
    if (!visitorId) {
      visitorId = typeof crypto?.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('writen_visitor_uuid', visitorId);
    }

    // 1. Record page view on mount
    recordViewMutation.mutate({ postId: post._id, visitorId });

    // 2. Set up scroll listener and timer for read tracking
    let secondsSpent = 0;
    let maxScrollPercent = 0;
    let hasRecordedRead = false;

    const dispatchReadTelemetry = () => {
      if (hasRecordedRead) return;
      hasRecordedRead = true;
      recordReadMutation.mutate({
        postId: post._id,
        visitorId,
        timeSpent: secondsSpent,
        scrollPercentage: Math.round(maxScrollPercent),
      });
    };

    const checkThresholds = () => {
      if (hasRecordedRead) return;
      if (secondsSpent >= 30 || maxScrollPercent >= 70) {
        dispatchReadTelemetry();
      }
    };

    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      if (pct > maxScrollPercent) {
        maxScrollPercent = pct;
      }
      checkThresholds();
    };

    const interval = setInterval(() => {
      secondsSpent += 1;
      checkThresholds();
    }, 1000);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', onScroll);
    };
  }, [post?._id, authLoading, accessToken]);

  const handleToggleBookmark = () => {
    if (post?._id) {
      toggleBookmarkMutation.mutate(post._id);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />
      
      <div className="flex-1 flex w-full">
        <SideNavBar />
        
        <main className="flex-1 flex justify-center py-10 pl-16 pr-margin-mobile md:pl-16 md:pr-margin-desktop relative transition-all duration-[450ms] ease-in-out">
          <Link 
            href="/feed" 
            className="absolute top-8 left-8 md:top-10 md:left-12 flex items-center gap-2 font-label-caps text-sm text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Feed
          </Link>

          <div className="w-full max-w-[720px] space-y-8 pt-10">
            {loading ? (
              <div className="space-y-6 animate-pulse py-12">
                <div className="h-4 bg-outline-variant/30 rounded w-16"></div>
                <div className="h-12 bg-outline-variant/30 rounded w-full"></div>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-10 h-10 bg-outline-variant/30 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-outline-variant/30 rounded w-28"></div>
                    <div className="h-3 bg-outline-variant/30 rounded w-36"></div>
                  </div>
                </div>
                <div className="w-full aspect-[2/1] bg-outline-variant/30 rounded-xl pt-4"></div>
                <div className="space-y-3 pt-6">
                  <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
                  <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
                  <div className="h-4 bg-outline-variant/30 rounded w-3/4"></div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-12 text-center space-y-6 editorial-shadow max-w-lg mx-auto mt-12">
                <span className="material-symbols-outlined text-5xl text-error mb-2 animate-bounce">warning</span>
                <h1 className="font-headline-lg text-2xl font-bold text-on-surface">Article Not Found</h1>
                <p className="font-body-md text-on-surface-variant max-w-sm mx-auto">
                  {error instanceof Error && error.message === 'Failed to fetch article details'
                    ? 'The story you are looking for might have been moved, deleted, or is currently saved as a draft.'
                    : (error instanceof Error ? error.message : String(error))}
                </p>
                <Link href="/feed" className="inline-flex bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase px-6 py-3 rounded-lg hover:opacity-90 transition-all cursor-pointer">
                  Back to Feed
                </Link>
              </div>
            ) : (
              <ArticleContent
                post={post}
                onToggleBookmark={handleToggleBookmark}
                bookmarking={toggleBookmarkMutation.isPending}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

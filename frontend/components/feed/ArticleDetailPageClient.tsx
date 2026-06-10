'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ArticleContent from '@/components/feed/ArticleContent';
import { useToggleBookmarkMutation } from '@/hooks/useBookmarks';
import { useRecordViewMutation, useRecordReadMutation } from '@/hooks/useAnalytics';

interface ArticleDetailPageClientProps {
  post: any;
}

export default function ArticleDetailPageClient({ post }: ArticleDetailPageClientProps) {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(post?.isBookmarked || false);

  // Sync state if the server post prop changes
  useEffect(() => {
    setIsBookmarked(post?.isBookmarked || false);
  }, [post?._id, post?.isBookmarked]);

  // ── React Query Queries & Mutations ──
  const toggleBookmarkMutation = useToggleBookmarkMutation(accessToken);
  const recordViewMutation = useRecordViewMutation(accessToken);
  const recordReadMutation = useRecordReadMutation(accessToken);

  const viewTracked = useRef<string | null>(null);



  // ── Telemetry Effects (View & Read) ──
  useEffect(() => {
    if (authLoading) return;
    if (!post?._id) return;

    // Ignore views and reads for the author
    const postAuthorId = typeof post.authorId === 'object' && post.authorId
      ? post.authorId._id?.toString()
      : post.authorId?.toString();
    const isAuthor = user && postAuthorId && user._id.toString() === postAuthorId;
    if (isAuthor) return;

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
  }, [post?._id, authLoading, accessToken, user]);

  const handleToggleBookmark = () => {
    if (post?._id) {
      const nextState = !isBookmarked;
      setIsBookmarked(nextState);
      toggleBookmarkMutation.mutate(post._id, {
        onError: () => {
          setIsBookmarked(!nextState);
        },
        onSuccess: (data) => {
          if (data && typeof data.bookmarked === 'boolean') {
            setIsBookmarked(data.bookmarked);
          }
        }
      });
    }
  };

  return (
    <main className="flex-1 flex justify-center py-10 relative transition-all duration-[450ms] ease-in-out">
      <Link 
        href="/feed" 
        className="absolute hidden md:flex top-8 left-8 md:top-10 md:left-12 items-center gap-2 font-label-caps text-sm text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent decoration-none"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Feed
      </Link>

      <div className="w-full max-w-[720px] space-y-8 pt-6 md:pt-10">
        <Link 
          href="/feed" 
          className="flex md:hidden items-center gap-2 font-label-caps text-sm text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent mb-4 w-fit decoration-none"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Feed
        </Link>
        
        <ArticleContent
          post={{ ...post, isBookmarked }}
          onToggleBookmark={handleToggleBookmark}
          bookmarking={toggleBookmarkMutation.isPending}
        />
      </div>
    </main>
  );
}

'use client';

import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import PostCardSkeleton from '@/components/feed/PostCardSkeleton';

export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />

      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto flex gap-3 md:gap-4 px-4 md:px-6">
        <SideNavBar />
        
        <div className="flex-1 py-8 max-w-[720px] mx-auto w-full space-y-6">
          {/* Header Title */}
          <div className="h-8 w-48 bg-outline-variant/20 rounded-md animate-pulse mb-6" />

          {/* Tab Selection */}
          <div className="border-b border-outline-variant/20 flex gap-6 pb-2 mb-6">
            <div className="h-6 w-20 bg-outline-variant/20 rounded-md animate-pulse" />
            <div className="h-6 w-28 bg-outline-variant/20 rounded-md animate-pulse" />
          </div>

          {/* Bookmarked lists loader */}
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    </div>
  );
}

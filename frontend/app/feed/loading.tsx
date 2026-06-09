'use client';

import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import PostCardSkeleton from '@/components/feed/PostCardSkeleton';

export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNavBar />
      
      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto flex gap-3 md:gap-4 px-4 md:px-6">
        <SideNavBar />
        
        <div className="flex-1 flex justify-center w-full">
          <div className="flex-1 max-w-[720px] py-6 space-y-6">
            {/* Show category tab skeletons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-outline-variant/20 mb-6 scrollbar-hide">
              <div className="h-8 w-16 bg-outline-variant/20 rounded-full animate-pulse shrink-0" />
              <div className="h-8 w-24 bg-outline-variant/20 rounded-full animate-pulse shrink-0" />
              <div className="h-8 w-20 bg-outline-variant/20 rounded-full animate-pulse shrink-0" />
              <div className="h-8 w-28 bg-outline-variant/20 rounded-full animate-pulse shrink-0" />
            </div>

            {/* List of loading articles */}
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';

export default function ArticleDetailLoading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />
      
      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto flex gap-3 md:gap-4 px-4 md:px-6">
        <SideNavBar />
        
        <div className="flex-1 py-8 max-w-[720px] mx-auto w-full space-y-6">
          {/* Back button skeleton */}
          <div className="h-6 w-24 bg-outline-variant/20 rounded animate-pulse" />

          {/* Title skeleton */}
          <div className="space-y-3 pt-4">
            <div className="h-10 w-full bg-outline-variant/20 rounded-lg animate-pulse" />
            <div className="h-10 w-3/4 bg-outline-variant/20 rounded-lg animate-pulse" />
          </div>

          {/* Author metadata skeleton */}
          <div className="flex items-center gap-3 py-4 border-y border-outline-variant/10">
            <div className="w-10 h-10 rounded-full bg-outline-variant/20 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-outline-variant/20 rounded animate-pulse" />
              <div className="h-3 w-24 bg-outline-variant/20 rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-outline-variant/20 rounded-full animate-pulse" />
          </div>

          {/* Cover image skeleton */}
          <div className="w-full aspect-[2/1] bg-outline-variant/10 border border-outline-variant/20 rounded-2xl animate-pulse" />

          {/* Content paragraphs skeleton */}
          <div className="space-y-4 py-4">
            <div className="h-4 w-full bg-outline-variant/20 rounded animate-pulse" />
            <div className="h-4 w-full bg-outline-variant/20 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-outline-variant/20 rounded animate-pulse" />
            <div className="h-4 w-full bg-outline-variant/20 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-outline-variant/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

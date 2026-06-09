'use client';

import TopNavBar from '@/components/layout/TopNavBar';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />

      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto px-4 md:px-6 py-8 space-y-8 animate-in fade-in duration-300">
        {/* Header Title & Button */}
        <div className="flex justify-between items-center">
          <div className="h-9 w-48 bg-outline-variant/20 rounded-md animate-pulse" />
          <div className="h-10 w-32 bg-outline-variant/20 rounded-full animate-pulse" />
        </div>

        {/* Stats Summary Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-outline-variant/10 border border-outline-variant/20 rounded-xl p-6 space-y-3">
            <div className="h-4 w-20 bg-outline-variant/20 rounded animate-pulse" />
            <div className="h-8 w-16 bg-outline-variant/20 rounded animate-pulse" />
          </div>
          <div className="h-28 bg-outline-variant/10 border border-outline-variant/20 rounded-xl p-6 space-y-3">
            <div className="h-4 w-24 bg-outline-variant/20 rounded animate-pulse" />
            <div className="h-8 w-16 bg-outline-variant/20 rounded animate-pulse" />
          </div>
          <div className="h-28 bg-outline-variant/10 border border-outline-variant/20 rounded-xl p-6 space-y-3">
            <div className="h-4 w-20 bg-outline-variant/20 rounded animate-pulse" />
            <div className="h-8 w-16 bg-outline-variant/20 rounded animate-pulse" />
          </div>
        </div>

        {/* Publication Tabs */}
        <div className="border-b border-outline-variant/20 flex gap-6 pb-2">
          <div className="h-6 w-24 bg-outline-variant/20 rounded animate-pulse" />
          <div className="h-6 w-24 bg-outline-variant/20 rounded animate-pulse" />
        </div>

        {/* Active Publication List Cards */}
        <div className="space-y-4">
          <div className="h-24 bg-outline-variant/10 border border-outline-variant/10 rounded-xl animate-pulse" />
          <div className="h-24 bg-outline-variant/10 border border-outline-variant/10 rounded-xl animate-pulse" />
          <div className="h-24 bg-outline-variant/10 border border-outline-variant/10 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

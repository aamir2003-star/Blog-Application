'use client';

import Link from 'next/link';

interface DashboardHeaderProps {
  viewMode: 'active' | 'trash';
  setViewMode: (mode: 'active' | 'trash') => void;
}

export default function DashboardHeader({
  viewMode,
  setViewMode,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-outline-variant/20 select-none">
      <div>
        <h1 className="font-display-xl text-3xl md:text-4xl font-bold tracking-tight text-on-surface leading-tight">
          {viewMode === 'active' ? 'Creator Space' : 'Trash Can'}
        </h1>
        <p className="font-body-md text-sm text-on-surface-variant mt-1.5 leading-relaxed">
          {viewMode === 'active' 
            ? 'Analyze performance metrics and manage your published publications catalog.'
            : 'Manage recently soft-deleted articles. Items can be restored or purged permanently.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {viewMode === 'active' ? (
          <>
            <Link
              href="/feed"
              className="border border-outline-variant/35 text-on-surface font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-surface-container-low hover:text-primary transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 decoration-none"
              title="Exit dashboard and go to home feed"
            >
              <span className="material-symbols-outlined text-[17px]">home</span>
              Home
            </Link>

            <button
              onClick={() => setViewMode('trash')}
              className="border border-outline-variant/35 text-on-surface font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-surface-container-low hover:text-primary transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 cursor-pointer focus:outline-none bg-transparent"
              title="View soft-deleted publications"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">delete</span>
              Trash Can
            </button>
            
            <Link
              href="/write"
              className="bg-primary text-on-primary font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 decoration-none"
            >
              <span className="material-symbols-outlined text-[16px]">edit_square</span>
              Write New Story
            </Link>
          </>
        ) : (
          <button
            onClick={() => setViewMode('active')}
            className="bg-primary text-on-primary font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 cursor-pointer focus:outline-none border-none"
          >
            <span className="material-symbols-outlined text-[17px]">dashboard</span>
            Back to Active
          </button>
        )}
      </div>
    </div>
  );
}

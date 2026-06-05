'use client';

import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden font-body-md text-on-surface p-6">
      {/* Decorative Grid Mesh Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(0, 109, 56, 0.03) 0, transparent 50%), 
            radial-gradient(at 50% 0%, rgba(0, 109, 56, 0.05) 0, transparent 50%), 
            radial-gradient(at 100% 0%, rgba(0, 109, 56, 0.03) 0, transparent 50%)
          `
        }}
      />

      <div className="text-center space-y-6 max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 select-none">
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center text-error border border-error/20 shadow-sm animate-bounce">
            <span className="material-symbols-outlined text-[36px]">lock</span>
          </div>
        </div>

        <h1 className="font-display-xl text-3xl md:text-4xl font-bold tracking-tight text-on-surface leading-tight">
          Workspace Locked
        </h1>
        
        <div className="space-y-3">
          <h2 className="font-headline-md text-lg font-semibold text-secondary">Creator Space is Restricted</h2>
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
            This dashboard is only available for authors. To unlock your Creator Workspace, start writing and publish your first technical article!
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/feed"
            className="inline-flex border border-outline-variant/35 text-on-surface font-label-caps text-xs px-6 py-3 rounded-full hover:bg-surface-container-low hover:text-primary transition-all active:scale-95 shadow-sm font-semibold gap-1.5 items-center decoration-none"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            Go to Feed
          </Link>
          <Link
            href="/write"
            className="inline-flex bg-primary text-on-primary font-label-caps text-xs px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold gap-1.5 items-center decoration-none"
          >
            <span className="material-symbols-outlined text-[16px]">edit_square</span>
            Write Your First Story
          </Link>
        </div>
      </div>
    </div>
  );
}

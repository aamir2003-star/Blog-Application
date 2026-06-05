'use client';

import Link from 'next/link';

export default function NotFound() {
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
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary border border-primary/10 shadow-sm animate-pulse">
            <span className="material-symbols-outlined text-[44px]">menu_book</span>
          </div>
        </div>

        <h1 className="font-display-xl text-5xl md:text-6xl font-bold tracking-tight text-on-surface leading-none">
          404
        </h1>
        
        <div className="space-y-2">
          <h2 className="font-headline-md text-2xl font-bold text-on-surface">Page Lost in Thought</h2>
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
            The article, topic, or path you are looking for has been moved, archived, or is currently saved as an draft.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/feed"
            className="inline-flex bg-primary text-on-primary font-label-caps text-xs px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold gap-1.5 items-center decoration-none"
          >
            <span className="material-symbols-outlined text-[16px]">explore</span>
            Explore Stories
          </Link>
        </div>
      </div>
    </div>
  );
}

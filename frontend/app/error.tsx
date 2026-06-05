'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an analytics or error tracking service
    console.error('Unhandled UI Crash:', error);
  }, [error]);

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
          <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center text-error border border-error/20 shadow-sm">
            <span className="material-symbols-outlined text-[36px] animate-bounce">warning</span>
          </div>
        </div>

        <h1 className="font-display-xl text-3xl md:text-4xl font-bold tracking-tight text-on-surface leading-tight">
          Something went wrong
        </h1>
        
        <div className="space-y-2">
          <h2 className="font-headline-md text-sm font-semibold text-on-surface-variant">An unexpected error occurred in the browser canvas.</h2>
          <p className="font-body-md text-xs text-error font-medium leading-relaxed max-w-sm mx-auto bg-error/5 p-3.5 rounded-xl border border-error/10 font-mono text-left overflow-x-auto max-h-[120px] no-scrollbar">
            {error.message || 'Error details unavailable.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/feed"
            className="inline-flex border border-outline-variant/35 text-on-surface font-label-caps text-xs px-6 py-3 rounded-full hover:bg-surface-container-low hover:text-primary transition-all active:scale-95 shadow-sm font-semibold gap-1.5 items-center decoration-none"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            Return Home
          </Link>
          <button
            onClick={() => reset()}
            className="inline-flex bg-primary text-on-primary font-label-caps text-xs px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold gap-1.5 items-center border-none cursor-pointer focus:outline-none"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProfileDropdown from '@/components/layout/ProfileDropdown';

interface WriteBarProps {
  syncStatus: 'idle' | 'saving' | 'saved' | 'offline_saved' | 'error';
  publishing: boolean;
  loadingPost: boolean;
  showManualSavedTick: boolean;
  user: any;
  onPublish: () => void;
  onSaveDraft: () => void;
}

export default function WriteBar({
  syncStatus,
  publishing,
  loadingPost,
  showManualSavedTick,
  user,
  onPublish,
  onSaveDraft,
}: WriteBarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoreMenu]);

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 sm:px-6 py-3 flex justify-between items-center select-none">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/feed" className="font-headline-lg text-lg sm:text-xl font-bold text-on-surface tracking-tight hover:opacity-90 decoration-none">
          Writen
        </Link>
        
        {syncStatus === 'idle' && (
          <span className="font-label-caps text-xs text-on-surface-variant px-2 py-0.5 sm:px-2.5 bg-surface-container rounded-md border border-outline-variant/10 select-none flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">edit</span>
            <span className="hidden sm:inline">Draft</span>
          </span>
        )}
        {syncStatus === 'saving' && (
          <span className="font-label-caps text-xs text-on-surface-variant/80 px-2 py-0.5 sm:px-2.5 bg-surface-container rounded-md border border-outline-variant/10 select-none flex items-center gap-1.5 animate-pulse">
            <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
            <span className="hidden sm:inline">Saving...</span>
          </span>
        )}
        {syncStatus === 'saved' && (
          <span className="font-label-caps text-xs text-primary bg-primary/10 px-2 py-0.5 sm:px-2.5 rounded-md border border-primary/20 select-none flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-[15px]">cloud_done</span>
            <span className="hidden sm:inline">Saved to cloud</span>
          </span>
        )}
        {syncStatus === 'offline_saved' && (
          <span className="font-label-caps text-xs text-tertiary bg-tertiary/10 px-2 py-0.5 sm:px-2.5 rounded-md border border-tertiary/20 select-none flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-[15px]">offline_pin</span>
            <span className="hidden sm:inline">Saved locally (offline)</span>
          </span>
        )}
        {syncStatus === 'error' && (
          <span className="font-label-caps text-xs text-error bg-error/10 px-2 py-0.5 sm:px-2.5 rounded-md border border-error/20 select-none flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-[15px]">warning</span>
            <span className="hidden sm:inline">Save failed</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onPublish}
          disabled={publishing || loadingPost}
          className="bg-primary text-on-primary font-label-caps text-xs px-4 sm:px-5 py-2 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5 sm:gap-2 shadow-sm font-semibold border-none cursor-pointer"
        >
          {publishing ? (
            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
          ) : null}
          Publish
        </button>
        
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer active:scale-95 bg-transparent border-none"
            title="More Actions"
          >
            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-11 w-48 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <Link
                href="/feed"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer decoration-none"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                Home
              </Link>
              
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onSaveDraft();
                }}
                disabled={syncStatus === 'saving' || publishing || loadingPost}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer w-full text-left disabled:opacity-60 focus:outline-none bg-transparent border-none"
              >
                {syncStatus === 'saving' ? (
                  <span className="material-symbols-outlined animate-spin text-[18px] text-on-surface-variant/70">progress_activity</span>
                ) : showManualSavedTick ? (
                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant/70">save</span>
                )}
                <span>
                  {syncStatus === 'saving' 
                    ? 'Saving...' 
                    : showManualSavedTick 
                      ? 'Saved!' 
                      : 'Save Draft'}
                </span>
              </button>
            </div>
          )}
        </div>
        {user && <ProfileDropdown />}
      </div>
    </header>
  );
}

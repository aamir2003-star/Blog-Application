'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUIStore } from '@/lib/ui-store';
import ProfileDropdown from './ProfileDropdown';
import TopicsDropdown from './TopicsDropdown';

function TopNavBarContent() {
  const { user } = useAuth();
  const { toggleSidebar } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchMobile, setShowSearchMobile] = useState(false);

  // Sync searchQuery with URL param
  useEffect(() => {
    const s = searchParams ? searchParams.get('search') : null;
    setSearchQuery(s || '');
  }, [searchParams]);

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    router.push(`/feed?${params.toString()}`);
  };

  return (
    <header className="relative bg-surface/80 backdrop-blur-md sticky top-0 z-50 w-full">
      <div className="max-w-[1280px] md:w-[80%] w-full mx-auto flex justify-between items-center px-4 md:px-6 py-2 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden flex p-1.5 -ml-1 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors items-center justify-center cursor-pointer active:scale-95"
            title="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <Link href="/feed" className="font-headline-lg text-xl font-bold text-on-surface select-none hover:opacity-90">
            Writen
          </Link>
          
          {/* Mobile search trigger button */}
          <button
            onClick={() => setShowSearchMobile(true)}
            className="sm:hidden flex p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors items-center justify-center cursor-pointer active:scale-95"
            title="Search articles"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          {/* Desktop Search */}
          <div className="relative hidden sm:flex items-center self-center">
            <span className="material-symbols-outlined absolute left-2.5 text-secondary text-[18px] md:text-[20px] select-none pointer-events-none">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
              className="pl-8 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 bg-surface-container-low border-none rounded-full text-body-md w-28 xs:w-36 sm:w-48 md:w-56 focus:ring-2 focus:ring-primary/20 transition-all text-xs md:text-sm outline-none placeholder:text-outline-variant/50" 
              placeholder="Search..." 
              type="text" 
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Topics Dropdown */}
          <TopicsDropdown />

          {/* Write Button */}
          {user ? (
            <Link href="/write" className="hidden md:flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors px-3 py-2">
              <span className="material-symbols-outlined text-[20px]">edit_square</span>
              <span className="font-label-caps text-sm">Write</span>
            </Link>
          ) : (
            <Link href="/login" className="hidden md:flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors px-3 py-2">
              <span className="font-label-caps text-sm">Write</span>
            </Link>
          )}
          
          {user ? (
            <ProfileDropdown />
          ) : (
            <Link href="/login" className="ml-1 px-4 py-2 bg-primary-container text-on-primary-container rounded-full font-label-caps text-sm hover:bg-primary transition-colors cursor-pointer">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {showSearchMobile && (
        <div className="absolute inset-0 bg-surface z-50 flex items-center px-4 gap-3 border-b border-outline-variant/30">
          <button
            onClick={() => setShowSearchMobile(false)}
            className="flex p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors items-center justify-center cursor-pointer"
            title="Close Search"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="relative flex-1 flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] select-none pointer-events-none">search</span>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                  setShowSearchMobile(false);
                }
              }}
              className="w-full pl-10 pr-10 py-1.5 bg-surface-container-low border-none rounded-full text-body-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant/50"
              placeholder="Search stories, topics, etc..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-on-surface-variant/70 hover:text-on-surface rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default function TopNavBar() {
  return (
    <Suspense fallback={
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 w-full">
        <div className="max-w-[1280px] md:w-[80%] w-full mx-auto flex justify-between items-center px-4 md:px-6 py-2 border-b border-outline-variant/30">
          <div className="h-8 w-24 bg-surface-container-low rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-surface-container-low rounded animate-pulse"></div>
        </div>
      </header>
    }>
      <TopNavBarContent />
    </Suspense>
  );
}


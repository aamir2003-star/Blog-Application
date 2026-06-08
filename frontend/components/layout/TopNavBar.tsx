'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUIStore } from '@/lib/ui-store';
import ProfileDropdown from './ProfileDropdown';
import TopicsDropdown from './TopicsDropdown';
import {
  useSearchSuggestionsQuery,
  useSearchHistoryQuery,
  useSaveSearchMutation,
  useDeleteSearchMutation,
} from '@/hooks/useSearch';

function TopNavBarContent() {
  const { user, accessToken } = useAuth();
  const { toggleSidebar } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [localHistory, setLocalHistory] = useState<string[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchMobileContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query to prevent duplicate rapid queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync searchQuery with URL param
  useEffect(() => {
    const s = searchParams ? searchParams.get('search') : null;
    setSearchQuery(s || '');
  }, [searchParams]);

  // Load local history on mount for guest/offline visitors
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('writen_local_search_history');
      if (stored) {
        try {
          setLocalHistory(JSON.parse(stored));
        } catch {
          setLocalHistory([]);
        }
      }
    }
  }, [user]);

  // Setup click outside listener to dismiss suggestions
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        searchContainerRef.current?.contains(target) ||
        searchMobileContainerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setFocusedIndex(-1);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Fetch queries
  const { data: suggestions = [] } = useSearchSuggestionsQuery(debouncedQuery);
  const { data: dbHistory = [] } = useSearchHistoryQuery(accessToken);
  const saveSearchMutation = useSaveSearchMutation(accessToken);
  const deleteSearchMutation = useDeleteSearchMutation(accessToken);

  // Combine history from DB or local storage
  const historyList = user 
    ? dbHistory.map(h => h.query) 
    : localHistory;

  // Active suggestions or history list to navigate
  const activeItems = debouncedQuery.trim().length > 0
    ? suggestions
    : historyList.map(h => ({ type: 'history' as const, text: h }));

  const saveQuery = (query: string) => {
    const clean = query.trim();
    if (!clean) return;

    if (user) {
      saveSearchMutation.mutate(clean);
    } else {
      const updated = [clean, ...localHistory.filter(h => h !== clean)].slice(0, 10);
      setLocalHistory(updated);
      localStorage.setItem('writen_local_search_history', JSON.stringify(updated));
    }
  };

  const deleteQuery = (query: string) => {
    if (user) {
      deleteSearchMutation.mutate(query);
    } else {
      const updated = localHistory.filter(h => h !== query);
      setLocalHistory(updated);
      localStorage.setItem('writen_local_search_history', JSON.stringify(updated));
    }
  };

  const handleSearch = (query: string) => {
    const clean = query.trim();
    if (!clean) return;

    saveQuery(clean);
    setIsOpen(false);

    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('search', clean);
    router.push(`/feed?${params.toString()}`);
  };

  const handleSelectSuggestion = (item: typeof activeItems[number]) => {
    setIsOpen(false);
    setFocusedIndex(-1);

    if (item.type === 'post') {
      router.push(`/feed/${item.payload.slug}`);
    } else if (item.type === 'category') {
      router.push(`/feed?category=${encodeURIComponent(item.text)}`);
    } else if (item.type === 'author') {
      router.push(`/feed?search=${encodeURIComponent(item.text)}`);
    } else {
      // It's a history item
      handleSearch(item.text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isMobileInput = false) => {
    if (!isOpen) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1 < activeItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 >= 0 ? prev - 1 : activeItems.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < activeItems.length) {
        handleSelectSuggestion(activeItems[focusedIndex]);
      } else {
        handleSearch(searchQuery);
      }
      if (isMobileInput) {
        setShowSearchMobile(false);
      }
    }
  };

  const renderDropdown = () => {
    if (!isOpen || activeItems.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="py-1 max-h-[300px] overflow-y-auto">
          {activeItems.map((item, index) => {
            const isFocused = index === focusedIndex;
            return (
              <div
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(item);
                }}
                className={`flex items-center justify-between px-4 py-2 cursor-pointer text-xs md:text-sm font-medium transition-all select-none ${
                  isFocused 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-on-surface hover:bg-surface-container-low/60'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.type === 'history' && (
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60 shrink-0">history</span>
                  )}
                  {item.type === 'category' && (
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">tag</span>
                  )}
                  {item.type === 'author' && (
                    item.payload?.avatar ? (
                      <img src={item.payload.avatar} className="w-4 h-4 rounded-full object-cover shrink-0" alt="" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">account_circle</span>
                    )
                  )}
                  {item.type === 'post' && (
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60 shrink-0">description</span>
                  )}
                  <span className="truncate">{item.text}</span>
                </div>

                {item.type === 'history' && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteQuery(item.text);
                    }}
                    className="p-0.5 hover:bg-surface-container rounded-full text-on-surface-variant/40 hover:text-error transition-colors shrink-0"
                    title="Remove from history"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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
            onClick={() => {
              setShowSearchMobile(true);
              setIsOpen(true);
            }}
            className="sm:hidden flex p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors items-center justify-center cursor-pointer active:scale-95"
            title="Search articles"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
 
          {/* Desktop Search */}
          <div ref={searchContainerRef} className="relative hidden sm:flex items-center self-center">
            <span className="material-symbols-outlined absolute left-2.5 text-secondary text-[18px] md:text-[20px] select-none pointer-events-none">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
                setFocusedIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => handleKeyDown(e, false)}
              className="pl-8 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 bg-surface-container-low border-none rounded-full text-body-md w-28 xs:w-36 sm:w-48 md:w-56 focus:ring-2 focus:ring-primary/20 transition-all text-xs md:text-sm outline-none placeholder:text-outline-variant/50" 
              placeholder="Search..." 
              type="text" 
            />
            {renderDropdown()}
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
            onClick={() => {
              setShowSearchMobile(false);
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="flex p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors items-center justify-center cursor-pointer"
            title="Close Search"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div ref={searchMobileContainerRef} className="relative flex-1 flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] select-none pointer-events-none">search</span>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
                setFocusedIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => handleKeyDown(e, true)}
              className="w-full pl-10 pr-10 py-1.5 bg-surface-container-low border-none rounded-full text-body-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant/50"
              placeholder="Search stories, topics, etc..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsOpen(true);
                  setFocusedIndex(-1);
                }}
                className="absolute right-3 p-1 text-on-surface-variant/70 hover:text-on-surface rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
            {renderDropdown()}
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


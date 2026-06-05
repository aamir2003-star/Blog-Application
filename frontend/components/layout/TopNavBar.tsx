'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useUIStore } from '@/lib/ui-store';
import ProfileDropdown from './ProfileDropdown';
import TopicsDropdown from './TopicsDropdown';

export default function TopNavBar() {
  const { user } = useAuth();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30 flex justify-between items-center px-4 md:px-6 py-2 w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 -ml-1 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors flex items-center justify-center cursor-pointer active:scale-95"
          title="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <Link href="/feed" className="font-headline-lg text-xl font-bold text-on-surface select-none hover:opacity-90">
          Writen
        </Link>
        <div className="relative flex items-center self-center">
          <span className="material-symbols-outlined absolute left-2.5 text-secondary text-[18px] md:text-[20px] select-none pointer-events-none">search</span>
          <input 
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

        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        
        {user ? (
          <ProfileDropdown />
        ) : (
          <Link href="/login" className="ml-1 px-4 py-2 bg-primary-container text-on-primary-container rounded-full font-label-caps text-sm hover:bg-primary transition-colors cursor-pointer">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

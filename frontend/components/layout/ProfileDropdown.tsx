'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/30 ml-1 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none"
        aria-label="User Profile Dropdown"
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-label-caps text-on-surface text-xs font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-11 w-56 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <div className="px-4 py-3 border-b border-outline-variant/20">
            <p className="font-body-md text-sm font-semibold text-on-surface truncate">{user.name}</p>
            <p className="font-body-md text-xs text-on-surface-variant truncate">{user.email}</p>
          </div>
          {user.role === 'CREATOR' && (
            <Link
              href="/dashboard"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">dashboard</span>
              <span>Dashboard</span>
            </Link>
          )}
          <Link
            href="/profile"
            onClick={() => setShowMenu(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Profile
          </Link>

          <div className="border-t border-outline-variant/20 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors w-full text-left font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

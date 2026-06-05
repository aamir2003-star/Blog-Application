'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/ui-store';

export default function SideNavBar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Screen size detection: default to closed on mobile and open on desktop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
      };

      // Set initial size
      handleResize();

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [setSidebarOpen]);

  const navItems = [
    { name: 'Home', icon: 'home', href: '/feed' },
    { name: 'Library', icon: 'bookmark', href: '/library' },
  ];

  // Close mobile drawer on navigation click
  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-all duration-300 cursor-pointer"
        />
      )}

      {/* Responsive Navigation Sidebar/Drawer */}
      <nav
        className={`fixed md:sticky top-0 md:top-[57px] left-0 h-full md:h-[calc(100vh-57px)] border-r border-outline-variant/30 py-6 md:py-4 px-4 md:px-3 bg-surface transition-all duration-[450ms] ease-in-out overflow-hidden flex flex-col justify-between z-50 md:z-30 shadow-2xl md:shadow-none ${
          sidebarOpen
            ? 'w-[240px] md:w-[180px] translate-x-0 opacity-100 pointer-events-auto'
            : 'w-[240px] md:w-0 -translate-x-full md:translate-x-0 md:border-r-0 md:opacity-0 md:px-0 md:pointer-events-none'
        }`}
      >
        {/* Navigation list */}
        <div>
          {/* Mobile Drawer Header */}
          <div className="flex md:hidden items-center justify-between mb-6 pb-4 border-b border-outline-variant/20">
            <span className="font-headline-lg text-lg font-bold text-on-surface">Menu</span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-surface-container text-on-surface font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low/60 hover:text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span className="font-body-md text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

      </nav>
    </>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

const DEFAULT_TOPICS = ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'DevOps', 'Databases', 'Security', 'Algorithms'];

export default function TopicsDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch categories when opening dropdown
  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/posts/categories');
        const data = res.data;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setTopics(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories in dropdown:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isOpen]);

  // Click away listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTopicClick = (topic: string) => {
    setIsOpen(false);
    router.push(`/feed?category=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-primary transition-all cursor-pointer border border-outline-variant/15 font-semibold text-xs md:text-sm font-label-caps select-none active:scale-95 outline-none focus:outline-none"
        title="Explore Topics"
      >
        <span className="material-symbols-outlined text-[18px]">interests</span>
        <span className="hidden sm:inline">Topics</span>
        <span 
          className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-primary' : 'text-on-surface-variant/70'
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-surface/90 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-4 shadow-xl w-[260px] sm:w-[320px] animate-in fade-in slide-in-from-top-2 duration-300 z-50 select-none">
          <div className="space-y-3">
            <h4 className="font-label-caps text-xs text-on-surface-variant font-bold tracking-wider mb-2">
              Recommended Topics
            </h4>
            
            {loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-on-surface-variant/70 text-xs">
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                <span>Loading topics...</span>
              </div>
            ) : topics.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic">No topics available</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicClick(topic)}
                    className="px-2.5 py-1 bg-surface-container-low text-on-surface hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all cursor-pointer border border-outline-variant/15 rounded-full text-xs font-semibold active:scale-95 outline-none focus:outline-none"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

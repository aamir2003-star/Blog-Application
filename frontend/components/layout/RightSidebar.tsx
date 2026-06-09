'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

const DEFAULT_TOPICS = ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'DevOps', 'Databases', 'Security', 'Algorithms'];

export default function RightSidebar({
  onSelectCategory,
  style
}: {
  onSelectCategory?: (topic: string) => void;
  style?: React.CSSProperties;
}) {
  const router = useRouter();

  // Dynamic States
  const [staffPicks, setStaffPicks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(true);
  const [showAllTopics, setShowAllTopics] = useState(false);

  useEffect(() => {
    const fetchSidebarData = async () => {
      setLoading(true);
      try {
        // Fetch 1. Staff Picks (Top 3 Recent)
        const staffPicksPromise = apiClient.get('/posts?limit=3').then(res => res.data);

        // Fetch 2. Dynamic Categories
        const categoriesPromise = apiClient.get('/posts/categories').then(res => res.data);

        const [picksData, catData] = await Promise.all([
          staffPicksPromise,
          categoriesPromise
        ]);

        if (picksData.success && Array.isArray(picksData.data)) {
          setStaffPicks(picksData.data);
        }
        if (catData.success && Array.isArray(catData.data) && catData.data.length > 0) {
          setCategories(catData.data);
        }
      } catch (err) {
        console.error('Failed to fetch dynamic sidebar items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarData();
  }, []);

  const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleTopicClick = (topic: string) => {
    if (onSelectCategory) {
      onSelectCategory(topic);
    } else {
      router.push(`/feed?category=${encodeURIComponent(topic)}`);
    }
  };

  // Select displayed topics
  const displayedTopics = showAllTopics ? categories : categories.slice(0, 7);

  return (
    <aside 
      style={style}
      className="hidden xl:block flex-1 max-w-[260px] sticky top-[73px] h-[calc(100vh-73px)] py-8 px-6 overflow-y-auto no-scrollbar font-body-md text-on-surface transition-all duration-[450ms] ease-in-out"
    >
      
      {/* Dynamic Staff Picks Section */}
      <div className="mb-10">
        <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-5 tracking-wider font-semibold">Staff Picks</h3>
        
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-outline-variant/30"></div>
                  <div className="w-16 h-3 bg-outline-variant/30 rounded"></div>
                </div>
                <div className="h-4 bg-outline-variant/30 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : staffPicks.length === 0 ? (
          <p className="text-xs text-on-surface-variant italic">No picks available</p>
        ) : (
          <div className="space-y-6">
            {staffPicks.map((post) => {
              const author = post.authorId || {};
              return (
                <div 
                  key={post._id} 
                  onClick={() => router.push(`/feed/${post.slug}`)}
                  className="group cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    {author.avatar ? (
                      <img src={author.avatar} className="w-4.5 h-4.5 rounded-full object-cover" alt={author.name || 'Author'} />
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {getAvatarFallback(author.name)}
                      </div>
                    )}
                    <span className="font-body-md text-xs font-semibold text-on-surface hover:text-primary transition-colors">{author.name || 'Anonymous'}</span>
                  </div>
                  <h4 className="font-headline-md text-[14px] font-bold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                </div>
              );
            })}
          </div>
        )}
      </div>



      {/* Dynamic Expandable Topics Section */}
      <div className="mb-10 pt-8 border-t border-outline-variant/10">
        <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-4 tracking-wider font-semibold">Recommended Topics</h3>
        <div className="flex flex-wrap gap-2">
          {displayedTopics.map(topic => (
            <button 
              key={topic} 
              onClick={() => handleTopicClick(topic)}
              className="px-3.5 py-1.5 bg-surface-container-low text-on-surface rounded-full text-xs hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all cursor-pointer border border-outline-variant/20 font-semibold active:scale-95 outline-none focus:outline-none"
            >
              {topic}
            </button>
          ))}

          {!showAllTopics && categories.length > 7 && (
            <button
              onClick={() => setShowAllTopics(true)}
              className="px-3.5 py-1.5 bg-surface-container-low text-on-surface-variant hover:text-on-surface rounded-full text-xs font-bold transition-all border border-outline-variant/20 flex items-center justify-center cursor-pointer active:scale-95 outline-none focus:outline-none"
              title="Show all topics"
            >
              <span className="material-symbols-outlined text-[16px]">more_horiz</span>
            </button>
          )}

          {showAllTopics && (
            <button
              onClick={() => setShowAllTopics(false)}
              className="px-3.5 py-1.5 bg-surface-container-low text-primary hover:bg-primary/5 rounded-full text-xs font-bold transition-all border border-primary/20 flex items-center justify-center cursor-pointer active:scale-95 outline-none focus:outline-none"
              title="Show fewer topics"
            >
              Show Less
            </button>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-on-surface-variant/80 pt-6 border-t border-outline-variant/10">
        <Link href="#" className="hover:text-primary transition-colors">Help</Link>
        <Link href="#" className="hover:text-primary transition-colors">Status</Link>
        <Link href="#" className="hover:text-primary transition-colors">About</Link>
        <Link href="#" className="hover:text-primary transition-colors">Careers</Link>
        <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
        <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
      </div>
    </aside>
  );
}

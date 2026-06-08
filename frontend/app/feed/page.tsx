import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import FeedPageClient from '@/components/feed/FeedPageClient';

export const metadata: Metadata = generateSEO({
  title: 'Feed | Tech & Engineering Stories',
  path: '/feed',
});


const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function FeedPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const categoryParam = resolvedSearchParams.category || null;
  const searchParam = resolvedSearchParams.search || null;

  let initialCategories: string[] = [];
  let initialPosts: any[] = [];

  try {
    // 1. Fetch categories
    const categoriesRes = await fetch(`${API}/posts/categories`, { 
      cache: 'no-store' 
    });
    if (categoriesRes.ok) {
      const data = await categoriesRes.json();
      if (data.success && Array.isArray(data.data)) {
        initialCategories = data.data;
      }
    }
  } catch (err) {
    console.error('Server-side category fetch failed:', err);
  }

  try {
    // 2. Fetch initial posts based on category and search query parameters
    let url = `${API}/posts?page=1&limit=10`;
    if (categoryParam && categoryParam !== 'For you' && categoryParam !== 'Following') {
      url += `&category=${encodeURIComponent(categoryParam)}`;
    }
    if (searchParam) {
      url += `&search=${encodeURIComponent(searchParam)}`;
    }

    const postsRes = await fetch(url, { 
      cache: 'no-store' 
    });
    if (postsRes.ok) {
      const data = await postsRes.json();
      if (data.success && Array.isArray(data.data)) {
        initialPosts = data.data;
      }
    }
  } catch (err) {
    console.error('Server-side posts fetch failed:', err);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNavBar />
      
      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto flex gap-6 md:gap-10 px-4 md:px-6">
        <SideNavBar />
        
        <div className="flex-1 flex justify-center w-full">
          <FeedPageClient
            initialPosts={initialPosts}
            initialCategories={initialCategories}
            categoryParam={categoryParam}
            searchParam={searchParam}
          />
        </div>
      </div>
    </div>
  );
}

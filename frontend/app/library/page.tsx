import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import LibraryPageClient from '@/components/library/LibraryPageClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default async function LibraryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('writen_access_token')?.value;

  if (!token) {
    redirect('/login?redirect=/library');
  }

  let initialBookmarks: any[] = [];
  let initialHistory: any[] = [];
  let isUnauthorized = false;

  try {
    // 1. Fetch Bookmarks
    const bookmarksRes = await fetch(`${API}/posts/bookmarks/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (bookmarksRes.status === 401) {
      isUnauthorized = true;
    } else if (bookmarksRes.ok) {
      const data = await bookmarksRes.json();
      if (data.success && Array.isArray(data.data)) {
        initialBookmarks = data.data;
      }
    }
  } catch (err) {
    console.error('Server-side bookmarks fetch failed:', err);
    throw err;
  }

  if (isUnauthorized) {
    redirect('/login?redirect=/library');
  }

  try {
    // 2. Fetch Reading History
    const historyRes = await fetch(`${API}/posts/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (historyRes.status === 401) {
      isUnauthorized = true;
    } else if (historyRes.ok) {
      const data = await historyRes.json();
      if (data.success && Array.isArray(data.data)) {
        initialHistory = data.data;
      }
    }
  } catch (err) {
    console.error('Server-side reading history fetch failed:', err);
    throw err;
  }

  if (isUnauthorized) {
    redirect('/login?redirect=/library');
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />

      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto flex gap-6 md:gap-10 px-4 md:px-6">
        <SideNavBar />
        <LibraryPageClient
          initialBookmarks={initialBookmarks}
          initialHistory={initialHistory}
        />
      </div>
    </div>
  );
}

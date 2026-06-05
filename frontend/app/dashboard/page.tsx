import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import TopNavBar from '@/components/layout/TopNavBar';
import DashboardPageClient from '@/components/dashboard/DashboardPageClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default async function CreatorDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('writen_access_token')?.value;

  if (!token) {
    redirect('/login?redirect=/dashboard');
  }

  let user: any = null;
  let initialMyPosts: any = null;
  let initialTrashPosts: any = null;
  let isNotCreator = false;
  let isUnauthorized = false;

  // 1. Authenticate user profile and check role server-side
  try {
    const userRes = await fetch(`${API}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (userRes.status === 401) {
      isUnauthorized = true;
    } else if (!userRes.ok) {
      throw new Error('Failed to retrieve user profile');
    } else {
      const userData = await userRes.json();
      user = userData.user;

      // Strict role check: Visitors cannot view the creator dashboard
      if (!user || user.role !== 'CREATOR') {
        isNotCreator = true;
      }
    }
  } catch (err) {
    console.error('Server-side user authentication failed:', err);
    throw err;
  }

  if (isUnauthorized) {
    redirect('/login?redirect=/dashboard');
  }

  if (isNotCreator) {
    notFound();
  }

  // 2. Fetch Creator Active Posts & Analytics
  try {
    const myPostsRes = await fetch(`${API}/posts/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (myPostsRes.ok) {
      initialMyPosts = await myPostsRes.json();
    }
  } catch (err) {
    console.error('Server-side active posts fetch failed:', err);
  }

  // 3. Fetch Creator Trashed Posts
  try {
    const trashPostsRes = await fetch(`${API}/posts/trash`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (trashPostsRes.ok) {
      initialTrashPosts = await trashPostsRes.json();
    }
  } catch (err) {
    console.error('Server-side trash posts fetch failed:', err);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col relative font-body-md text-on-surface">
      <TopNavBar />
      <DashboardPageClient 
        initialMyPosts={initialMyPosts}
        initialTrashPosts={initialTrashPosts}
      />
    </div>
  );
}

import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import ArticleDetailPageClient from '@/components/feed/ArticleDetailPageClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('writen_access_token')?.value;

  let post: any = null;
  let isNotFound = false;

  try {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API}/posts/${slug}`, {
      headers,
      cache: 'no-store'
    });

    if (res.status === 404) {
      isNotFound = true;
    } else if (!res.ok) {
      throw new Error(`Failed to load article details: ${res.statusText}`);
    } else {
      const data = await res.json();
      if (data.success && data.data) {
        post = data.data;
      } else {
        isNotFound = true;
      }
    }
  } catch (err) {
    console.error('Server-side post fetch failed:', err);
    throw err;
  }

  if (isNotFound) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />
      
      <div className="flex-1 w-full max-w-[1280px] md:w-[80%] mx-auto flex gap-6 md:gap-10 px-4 md:px-6">
        <SideNavBar />
        <ArticleDetailPageClient post={post} />
      </div>
    </div>
  );
}

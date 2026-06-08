import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { Metadata } from 'next';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import ArticleDetailPageClient from '@/components/feed/ArticleDetailPageClient';
import { generateSEO } from '@/lib/seo';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Cache the fetch to prevent duplicate calls within a single render cycle
const getCachedPost = cache(async (slug: string, token?: string) => {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}/posts/${slug}`, {
    headers,
    cache: 'no-store'
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load article details: ${res.statusText}`);
  }
  const data = await res.json();
  return data.success && data.data ? data.data : null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('writen_access_token')?.value;

  try {
    const post = await getCachedPost(slug, token);
    if (!post) {
      return generateSEO({
        title: 'Article Not Found',
        noIndex: true,
      });
    }

    const keywordsArray = post.seoKeywords
      ? post.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : [];

    return generateSEO({
      title: post.title,
      description: post.excerpt || undefined,
      image: post.coverImage || undefined,
      keywords: keywordsArray,
      path: `/feed/${slug}`,
      noIndex: post.status === 'DRAFT',
    });
  } catch (err) {
    console.error('Failed to generate metadata for post:', err);
    return generateSEO({
      title: 'Article Details',
      noIndex: true,
    });
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('writen_access_token')?.value;

  let post: any = null;
  try {
    post = await getCachedPost(slug, token);
  } catch (err) {
    console.error('Server-side post fetch failed:', err);
    throw err;
  }

  if (!post) {
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


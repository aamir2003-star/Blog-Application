'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function ArticleReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { accessToken } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError('');
      try {
        const headers: any = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        const res = await fetch(`${API}/posts/${slug}`, { headers });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load article');
        }
        
        if (data.success && data.data) {
          setPost(data.data);
        }
      } catch (err: any) {
        setError(err.message || 'Article not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, accessToken]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const calculateReadingTime = (htmlStr: string) => {
    if (!htmlStr) return 1;
    const text = htmlStr.replace(/<\/?[^>]+(>|$)/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes || 1;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNavBar />
      
      <div className="flex-1 flex w-full">
        <SideNavBar />
        
        <main className="flex-1 flex justify-center py-10 pl-16 pr-margin-mobile md:pl-16 md:pr-margin-desktop relative transition-all duration-[450ms] ease-in-out">
          {/* Floating Back Navigation Header */}
          <Link 
            href="/feed" 
            className="absolute top-8 left-8 md:top-10 md:left-12 flex items-center gap-2 font-label-caps text-sm text-secondary hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Feed
          </Link>

          <div className="w-full max-w-[720px] space-y-8 pt-10">
            {loading ? (
              <div className="space-y-6 animate-pulse py-12">
                <div className="h-4 bg-outline-variant/30 rounded w-16"></div>
                <div className="h-12 bg-outline-variant/30 rounded w-full"></div>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-10 h-10 bg-outline-variant/30 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-outline-variant/30 rounded w-28"></div>
                    <div className="h-3 bg-outline-variant/30 rounded w-36"></div>
                  </div>
                </div>
                <div className="w-full aspect-[2/1] bg-outline-variant/30 rounded-xl pt-4"></div>
                <div className="space-y-3 pt-6">
                  <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
                  <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
                  <div className="h-4 bg-outline-variant/30 rounded w-3/4"></div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-12 text-center space-y-6 editorial-shadow max-w-lg mx-auto mt-12">
                <span className="material-symbols-outlined text-5xl text-error mb-2 animate-bounce">warning</span>
                <h1 className="font-headline-lg text-2xl font-bold text-on-surface">Article Not Found</h1>
                <p className="font-body-md text-on-surface-variant max-w-sm mx-auto">
                  {error === 'Post not found.' 
                    ? 'The story you are looking for might have been moved, deleted, or is currently saved as a draft.'
                    : error}
                </p>
                <Link href="/feed" className="inline-flex bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase px-6 py-3 rounded-lg hover:opacity-90 transition-all cursor-pointer">
                  Back to Feed
                </Link>
              </div>
            ) : (
              <article className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Header Category Tag */}
                {post.category && (
                  <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-semibold tracking-wider font-label-caps border border-primary/20">
                    {post.category}
                  </span>
                )}

                {/* Article Title */}
                <h1 className="font-headline-lg text-3xl md:text-4xl lg:text-[40px] font-bold text-on-surface leading-[1.1] tracking-tight">
                  {post.title}
                </h1>

                {/* Author Profile Metadata Row */}
                <div className="flex items-center justify-between border-y border-outline-variant/30 py-4">
                  <div className="flex items-center gap-3">
                    {post.authorId?.avatar ? (
                      <img 
                        src={post.authorId.avatar} 
                        className="w-10 h-10 rounded-full object-cover border border-outline-variant/20" 
                        alt={post.authorId.name || 'Author'} 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {getAvatarFallback(post.authorId?.name)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-body-md text-sm text-on-surface font-semibold">{post.authorId?.name || 'Anonymous'}</span>
                        {post.authorId?.role === 'CREATOR' && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold font-label-caps uppercase">Creator</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                        <span>{formatDate(post.createdAt)}</span>
                        <span>·</span>
                        <span>{calculateReadingTime(post.htmlContent)} min read</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-on-surface-variant text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      <span>{post.views || 0} views</span>
                    </div>
                  </div>
                </div>

                {/* Optional Cover Image Banner */}
                {post.coverImage && (
                  <div className="w-full aspect-[2/1] overflow-hidden rounded-xl border border-outline-variant/30">
                    <img 
                      src={post.coverImage} 
                      className="w-full h-full object-cover animate-in zoom-in-95 duration-500" 
                      alt={post.title} 
                    />
                  </div>
                )}

                {/* Rich-Text Content Column */}
                <div className="tiptap font-serif text-lg leading-relaxed text-on-surface/90 pt-4">
                  <div dangerouslySetInnerHTML={{ __html: post.htmlContent }} />
                </div>

              </article>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

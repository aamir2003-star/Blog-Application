'use server';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export async function getPostsAction(page: number, category?: string, search?: string) {
  try {
    let url = `${API}/posts?page=${page}&limit=10`;
    
    if (category && category !== 'For you' && category !== 'Following') {
      url += `&category=${encodeURIComponent(category)}`;
    }

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      throw new Error(`Backend error: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error('getPostsAction failed:', err);
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : 'Unknown server action error',
    };
  }
}

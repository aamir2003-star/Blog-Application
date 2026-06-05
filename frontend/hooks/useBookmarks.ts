import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// ─── Fetch User's Bookmarked Posts ───
export function useBookmarksQuery(accessToken: string | null, initialData?: any[]) {
  return useQuery({
    queryKey: ['bookmarks', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/posts/bookmarks/list`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch bookmarks');
      const resData = await res.json();
      return resData.data as any[];
    },
    initialData,
    staleTime: initialData ? Infinity : 0,
  });
}

// ─── Toggle Bookmark Status Mutation ───
export function useToggleBookmarkMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE}/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle bookmark');
      return data;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Update Bookmark Note Mutation ───
export function useUpdateBookmarkNoteMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, note }: { postId: string; note: string }) => {
      const res = await fetch(`${API_BASE}/posts/${postId}/bookmark/note`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update personal note');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

// ─── Fetch User's Reading History ───
export function useReadingHistoryQuery(accessToken: string | null, initialData?: any[]) {
  return useQuery({
    queryKey: ['readingHistory', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/posts/history`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch reading history');
      const resData = await res.json();
      return resData.data as any[];
    },
    initialData,
    staleTime: initialData ? Infinity : 0,
  });
}

// ─── Delete Reading History Mutation ───
export function useDeleteHistoryMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (historyId: string) => {
      const res = await fetch(`${API_BASE}/posts/history/${historyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete history entry');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingHistory'] });
    },
  });
}


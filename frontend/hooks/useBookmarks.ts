import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

// ─── Fetch User's Bookmarked Posts ───
export function useBookmarksQuery(accessToken?: string | null, initialData?: any[]) {
  return useQuery({
    queryKey: ['bookmarks', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await apiClient.get('/posts/bookmarks/list');
      return res.data.data as any[];
    },
    initialData,
    staleTime: initialData ? Infinity : 0,
  });
}

// ─── Toggle Bookmark Status Mutation ───
export function useToggleBookmarkMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiClient.post(`/posts/${postId}/bookmark`);
      return res.data;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Update Bookmark Note Mutation ───
export function useUpdateBookmarkNoteMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, note }: { postId: string; note: string }) => {
      const res = await apiClient.patch(`/posts/${postId}/bookmark/note`, { note });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

// ─── Fetch User's Reading History ───
export function useReadingHistoryQuery(accessToken?: string | null, initialData?: any[]) {
  return useQuery({
    queryKey: ['readingHistory', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await apiClient.get('/posts/history');
      return res.data.data as any[];
    },
    initialData,
    staleTime: initialData ? Infinity : 0,
  });
}

// ─── Delete Reading History Mutation ───
export function useDeleteHistoryMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (historyId: string) => {
      const res = await apiClient.delete(`/posts/history/${historyId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingHistory'] });
    },
  });
}

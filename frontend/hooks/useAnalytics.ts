import { useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// ─── Record View Mutation ───
export function useRecordViewMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, visitorId }: { postId: string; visitorId: string }) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${API_BASE}/posts/${postId}/view`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ visitorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record view');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

// ─── Record Read Mutation ───
export function useRecordReadMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      visitorId,
      timeSpent,
      scrollPercentage,
    }: {
      postId: string;
      visitorId: string;
      timeSpent: number;
      scrollPercentage: number;
    }) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${API_BASE}/posts/${postId}/read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ visitorId, timeSpent, scrollPercentage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record read');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

// ─── Record View Mutation ───
export function useRecordViewMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, visitorId }: { postId: string; visitorId: string }) => {
      const res = await apiClient.post(`/posts/${postId}/view`, { visitorId });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['readingHistory'] });
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
      const res = await apiClient.post(`/posts/${postId}/read`, {
        visitorId,
        timeSpent,
        scrollPercentage,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

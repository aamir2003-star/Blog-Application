import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

// ─── Fetch Categories ───
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/posts/categories');
      return res.data.data as string[];
    },
  });
}

// ─── Fetch Public Feed Posts ───
interface UsePostsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export function usePostsQuery(params: UsePostsQueryParams) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: async () => {
      const { page = 1, limit = 10, category = '', search = '' } = params;
      const res = await apiClient.get('/posts', {
        params: { page, limit, category, search },
      });
      return res.data;
    },
  });
}

// ─── Fetch Post Detail By Slug or ID ───
export function usePostDetailQuery(slugOrId: string | null, accessToken?: string | null) {
  return useQuery({
    queryKey: ['post', slugOrId, !!accessToken],
    enabled: !!slugOrId,
    queryFn: async () => {
      const res = await apiClient.get(`/posts/${slugOrId}`);
      return res.data.data;
    },
  });
}

// ─── Create Post Mutation ───
export function useCreatePostMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/posts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Update Post Mutation ───
export function useUpdatePostMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.put(`/posts/${id}`, payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Delete Post Mutation (Soft Delete) ───
export function useDeletePostMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, otpCode }: { id: string; otpCode?: string }) => {
      const headers: Record<string, string> = {};
      if (otpCode) {
        headers['x-delete-code'] = otpCode;
      }
      const res = await apiClient.delete(`/posts/${id}`, { headers });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['trashPosts'] });
    },
  });
}

// ─── Toggle Post DRAFT/PUBLISHED Status Mutation ───
export function useToggleStatusMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: 'DRAFT' | 'PUBLISHED' }) => {
      const res = await apiClient.patch(`/posts/${id}/status`, { status: nextStatus });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Request Published Deletion OTP Mutation ───
export function useRequestDeleteOtpMutation(accessToken?: string | null) {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/posts/${id}/request-delete`);
      return res.data;
    },
  });
}

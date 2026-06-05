import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// ─── Fetch Categories ───
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/posts/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const resData = await res.json();
      return resData.data as string[];
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
      const url = new URL(`${API_BASE}/posts`);
      url.searchParams.append('page', String(page));
      url.searchParams.append('limit', String(limit));
      if (category) url.searchParams.append('category', category);
      if (search) url.searchParams.append('search', search);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch feed posts');
      return res.json();
    },
  });
}

// ─── Fetch Post Detail By Slug or ID ───
export function usePostDetailQuery(slugOrId: string | null, accessToken?: string | null) {
  return useQuery({
    queryKey: ['post', slugOrId, !!accessToken],
    enabled: !!slugOrId,
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${API_BASE}/posts/${slugOrId}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch article details');
      const resData = await res.json();
      return resData.data;
    },
  });
}

// ─── Create Post Mutation ───
export function useCreatePostMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create post');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Update Post Mutation ───
export function useUpdatePostMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update post');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Delete Post Mutation (Soft Delete) ───
export function useDeletePostMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, otpCode }: { id: string; otpCode?: string }) => {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${accessToken}`,
      };
      if (otpCode) {
        headers['x-delete-code'] = otpCode;
      }
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete publication');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['trashPosts'] });
    },
  });
}

// ─── Toggle Post DRAFT/PUBLISHED Status Mutation ───
export function useToggleStatusMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: 'DRAFT' | 'PUBLISHED' }) => {
      const res = await fetch(`${API_BASE}/posts/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle status');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Request Published Deletion OTP Mutation ───
export function useRequestDeleteOtpMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/posts/${id}/request-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP code');
      return data;
    },
  });
}

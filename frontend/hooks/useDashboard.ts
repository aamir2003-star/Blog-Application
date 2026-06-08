import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

// ─── Fetch Creator's Active Posts & Analytics ───
export function useMyPostsQuery(accessToken?: string | null, initialData?: any) {
  return useQuery({
    queryKey: ['myPosts', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await apiClient.get('/posts/my');
      return res.data;
    },
    initialData,
    staleTime: initialData ? Infinity : 0,
  });
}

// ─── Fetch Creator's Trashed Posts ───
export function useTrashPostsQuery(accessToken?: string | null, initialData?: any) {
  return useQuery({
    queryKey: ['trashPosts', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await apiClient.get('/posts/trash');
      return res.data;
    },
    initialData,
    staleTime: initialData ? Infinity : 0,
  });
}

// ─── Restore Post Mutation ───
export function useRestorePostMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/posts/${id}/restore`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['trashPosts'] });
    },
  });
}

// ─── Permanent Delete Mutation ───
export function usePermanentDeleteMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/posts/${id}/permanent`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashPosts'] });
    },
  });
}

// ─── Update Settings (autoDeleteTrash toggle) Mutation ───
export function useUpdateSettingsMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (autoDeleteTrash: boolean) => {
      const res = await apiClient.patch('/auth/settings', { autoDeleteTrash });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashPosts'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// ─── Fetch Creator's Active Posts & Analytics ───
export function useMyPostsQuery(accessToken: string | null, initialData?: any) {
  return useQuery({
    queryKey: ['myPosts', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/posts/my`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch creator publications');
      return res.json();
    },
    initialData,
    staleTime: initialData ? Infinity : 0,
  });
}

// ─── Fetch Creator's Trashed Posts ───
export function useTrashPostsQuery(accessToken: string | null, initialData?: any) {
  return useQuery({
    queryKey: ['trashPosts', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/posts/trash`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch trashed publications');
      return res.json();
    },
    initialData,
    staleTime: initialData ? Infinity : 0,
  });
}

// ─── Restore Post Mutation ───
export function useRestorePostMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/posts/${id}/restore`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to restore publication');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['trashPosts'] });
    },
  });
}

// ─── Permanent Delete Mutation ───
export function usePermanentDeleteMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/posts/${id}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to purge publication');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashPosts'] });
    },
  });
}

// ─── Update Settings (autoDeleteTrash toggle) Mutation ───
export function useUpdateSettingsMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (autoDeleteTrash: boolean) => {
      const res = await fetch(`${API_BASE}/auth/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ autoDeleteTrash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update settings');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashPosts'] });
    },
  });
}

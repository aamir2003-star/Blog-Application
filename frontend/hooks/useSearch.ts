import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface Suggestion {
  type: 'category' | 'author' | 'post';
  text: string;
  payload?: any;
}

export interface HistoryItem {
  _id: string;
  userId: string;
  query: string;
  createdAt: string;
}

// ─── Fetch Autocomplete Suggestions ───
export function useSearchSuggestionsQuery(q: string) {
  return useQuery({
    queryKey: ['searchSuggestions', q],
    enabled: q.trim().length > 0,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/search/suggestions?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const data = await res.json();
      return data.data as Suggestion[];
    },
    staleTime: 30 * 1000, // Cache suggestions for 30 seconds
  });
}

// ─── Fetch User Search History ───
export function useSearchHistoryQuery(accessToken: string | null) {
  return useQuery({
    queryKey: ['searchHistory', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/search/history`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch search history');
      const data = await res.json();
      return data.data as HistoryItem[];
    },
  });
}

// ─── Save Search Query Mutation ───
export function useSaveSearchMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query: string) => {
      if (!accessToken) return;
      const res = await fetch(`${API_BASE}/search/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save search');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });
}

// ─── Delete Search Query Mutation ───
export function useDeleteSearchMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query: string) => {
      if (!accessToken) return;
      const res = await fetch(`${API_BASE}/search/history/${encodeURIComponent(query)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete search item');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });
}

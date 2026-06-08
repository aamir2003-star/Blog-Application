import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

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
      const res = await apiClient.get('/search/suggestions', {
        params: { q: q.trim() },
      });
      return res.data.data as Suggestion[];
    },
    staleTime: 30 * 1000, // Cache suggestions for 30 seconds
  });
}

// ─── Fetch User Search History ───
export function useSearchHistoryQuery(accessToken?: string | null) {
  return useQuery({
    queryKey: ['searchHistory', !!accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await apiClient.get('/search/history');
      return res.data.data as HistoryItem[];
    },
  });
}

// ─── Save Search Query Mutation ───
export function useSaveSearchMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query: string) => {
      if (!accessToken) return;
      const res = await apiClient.post('/search/history', { query });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });
}

// ─── Delete Search Query Mutation ───
export function useDeleteSearchMutation(accessToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query: string) => {
      if (!accessToken) return;
      const res = await apiClient.delete(`/search/history/${encodeURIComponent(query)}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });
}

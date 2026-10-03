import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // 30s — avoid re-fetching on every focus
      refetchOnWindowFocus: false,
    },
  },
});

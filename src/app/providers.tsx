'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/reactQueryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

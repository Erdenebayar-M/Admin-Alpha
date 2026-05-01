'use client';

import { useQuery } from '@tanstack/react-query';
import { getContentStats } from '@/lib/api';
import type { ContentStats } from '@/lib/types';

export function useContentStats() {
  return useQuery<ContentStats>({
    queryKey: ['content-stats'],
    queryFn: getContentStats,
    staleTime: 60_000,
  });
}

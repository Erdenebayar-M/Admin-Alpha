'use client';

import { useQuery } from '@tanstack/react-query';
import { getActivityStats } from '@/lib/api';
import type { ActivityStats } from '@/lib/types';

export function useActivityStats() {
  return useQuery<ActivityStats>({
    queryKey: ['activity-stats'],
    queryFn: getActivityStats,
    staleTime: 10_000,
    refetchInterval: 15_000, // auto-refresh so a running bot load shows up live
  });
}

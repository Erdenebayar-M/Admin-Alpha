"use client";

import { useQuery } from "@tanstack/react-query";
import { getTaskVariants, type TaskFilters } from "@/lib/api";
import { variantToReviewItem } from "@/lib/variant-mapper";
import type { ReviewItem, ReviewStatus } from "@/lib/types";

interface ReviewQueueFilters {
  status?: ReviewStatus;
  stage?: string;
  grade_band?: string;
  skill?: string;
}

export function useReviewQueue(filters?: ReviewQueueFilters) {
  const apiFilters: TaskFilters = {
    ...(filters?.stage && { stage: filters.stage }),
    ...(filters?.grade_band && { grade: filters.grade_band }),
    ...(filters?.skill && { skill: filters.skill }),
  };

  return useQuery({
    queryKey: ["review-queue", filters],
    staleTime: 30_000,
    queryFn: async (): Promise<ReviewItem[]> => {
      const variants = await getTaskVariants(apiFilters);
      let items = variants.map(variantToReviewItem);
      if (filters?.status) {
        items = items.filter((item) => item.status === filters.status);
      }
      return items;
    },
  });
}

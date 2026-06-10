'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editVariant } from '@/lib/api';
import type { ReviewItem, TaskContent } from '@/lib/types';

export function useUpdateTaskContent(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<TaskContent>): Promise<void> => {
      const item = queryClient.getQueryData<ReviewItem>(['review-item', itemId]);
      const variantId = item?.variant_id ?? itemId;
      await editVariant(variantId, patch);
    },
    onSuccess: (_data, patch) => {
      queryClient.setQueryData<ReviewItem>(['review-item', itemId], (old) => {
        if (!old) return old;
        return { ...old, task: { ...old.task, ...patch } };
      });
    },
  });
}

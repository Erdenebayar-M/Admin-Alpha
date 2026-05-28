"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveVariant,
  flagVariant,
  rejectVariant,
  reviseVariant,
  getTaskVariant,
} from "@/lib/api";
import { variantToReviewItem } from "@/lib/variant-mapper";
import type { ReviewAction, ReviewItem } from "@/lib/types";

export function useReviewItem(taskId: string) {
  return useQuery({
    queryKey: ["review-item", taskId],
    queryFn: async (): Promise<ReviewItem> => {
      // taskId is the draft UUID — backend UUID lookup returns the specific variant
      const variants = await getTaskVariant(taskId);
      if (!variants.length) throw new Error(`Task "${taskId}" not found`);
      const match = variants.find((v) => v.id === taskId) ?? variants[0];
      return variantToReviewItem(match);
    },
    enabled: Boolean(taskId),
    staleTime: 30_000,
  });
}

export function useSubmitReview(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: ReviewAction): Promise<void> => {
      const item = queryClient.getQueryData<ReviewItem>([
        "review-item",
        taskId,
      ]);
      const variantId = item?.variant_id ?? taskId;
      // Use logical task_id from the loaded item (e.g. "G12-TT_LETTER_FILL"), not the URL UUID
      const baseTaskId = item?.task.task_id ?? taskId;
      const note = action.note ?? "";

      if (action.action === "approve") {
        await approveVariant(baseTaskId, variantId, note || undefined);
      } else if (action.action === "reject") {
        await rejectVariant(baseTaskId, variantId, note ?? "");
      } else if (action.action === "request_revision") {
        await reviseVariant(baseTaskId, variantId, note ?? "");
      } else {
        await flagVariant(baseTaskId, variantId, note ?? "");
      }
    },
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: ["review-item", taskId] });
      const previous = queryClient.getQueryData<ReviewItem>([
        "review-item",
        taskId,
      ]);

      const statusMap = {
        approve: "human_approved",
        reject: "human_rejected",
        request_revision: "needs_revision",
      } as const;

      queryClient.setQueryData<ReviewItem>(["review-item", taskId], (old) => {
        if (!old) return old;
        return {
          ...old,
          status: statusMap[action.action],
          reviewer_notes: action.note ?? null,
        };
      });

      return { previous };
    },
    onError: (_err, _action, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["review-item", taskId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["review-item", taskId] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
    },
  });
}

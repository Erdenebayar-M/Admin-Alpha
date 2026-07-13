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
      const note = action.note ?? "";

      if (action.action === "approve") {
        await approveVariant(variantId, note || undefined);
      } else if (action.action === "reject") {
        await rejectVariant(variantId, note ?? "");
      } else if (action.action === "request_revision") {
        await reviseVariant(variantId, note ?? "");
      } else {
        await flagVariant(variantId, note ?? "");
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

      const previousQueues = queryClient.getQueriesData<ReviewItem[]>({
        queryKey: ["review-queue"],
      });
      queryClient.setQueriesData<ReviewItem[]>(
        { queryKey: ["review-queue"] },
        (old) => old?.filter((i) => i.id !== taskId),
      );

      return { previous, previousQueues };
    },
    onError: (_err, _action, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["review-item", taskId], context.previous);
      }
      context?.previousQueues?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["review-item", taskId] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
    },
  });
}

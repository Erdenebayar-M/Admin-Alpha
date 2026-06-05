"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/lib/modal-store";
import { useReviewItem, useSubmitReview } from "@/hooks/useReviewItem";
import { useUpdateTaskContent } from "@/hooks/useTaskActions";
import { useHotkeys } from "@/hooks/useHotkeys";
import { TaskPreview } from "@/components/review/TaskPreview";
import { ReviewPanel, type ReviewPanelRef } from "@/components/review/ReviewPanel";
import {
  KeyboardShortcutsHelp,
  ShortcutsHelpButton,
} from "@/components/review/KeyboardShortcutsHelp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogBody,
} from "@/components/ui/dialog";
import type { ReviewAction, TaskContent } from "@/lib/types";

const TOAST_MESSAGES: Record<ReviewAction["action"], string> = {
  approve: "Даалгавар батлагдлаа.",
  reject: "Даалгавар татгалзагдлаа.",
  request_revision: "Засах хүсэлт илгээгдлаа.",
};

function ReviewDetailContent({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: item, isLoading, isError } = useReviewItem(id);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<TaskContent>>({});
  const [savedEdits, setSavedEdits] = useState<Partial<TaskContent> | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const reviewPanelRef = useRef<ReviewPanelRef>(null);
  const submitMutation = useSubmitReview(id);
  const updateMutation = useUpdateTaskContent(id);

  const showToast = useCallback((message: string, duration = 2500) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, []);

  const handleEnterEdit = useCallback(() => {
    if (!item) return;
    setEditDraft({
      prompt_text: item.task.prompt_text,
      correct_answer: item.task.correct_answer,
      feedback_text: item.task.feedback_text,
      feedback_correct: item.task.feedback_correct ?? '',
      feedback_wrong: item.task.feedback_wrong ?? '',
    });
    setIsEditMode(true);
  }, [item]);

  const handleCancelEdit = useCallback(() => {
    setEditDraft({});
    setIsEditMode(false);
  }, []);

  const handleSaveEdit = useCallback(() => {
    updateMutation.mutate(editDraft, {
      onSuccess: () => {
        setSavedEdits(editDraft);
        setIsEditMode(false);
        showToast("Даалгавар шинэчлэгдлаа — батлахад бэлэн");
      },
    });
  }, [editDraft, updateMutation, showToast]);

  const handleSubmit = useCallback(
    (action: ReviewAction) => {
      submitMutation.mutate(action, {
        onSuccess: () => {
          showToast(TOAST_MESSAGES[action.action], 2000);
          setTimeout(() => onClose(), 300);
        },
      });
    },
    [submitMutation, onClose, showToast],
  );

  useHotkeys(
    useMemo(
      () => ({
        a: () => {
          if (!isEditMode && !submitMutation.isPending) {
            reviewPanelRef.current?.triggerAction("approve");
          }
        },
        r: () => reviewPanelRef.current?.focusNote(),
        "shift+r": () => reviewPanelRef.current?.triggerAction("request_revision"),
        x: () => reviewPanelRef.current?.triggerAction("reject"),
        e: () => (isEditMode ? handleCancelEdit() : handleEnterEdit()),
        escape: () => {
          if (!isHelpOpen) onClose();
        },
        "?": () => setIsHelpOpen(true),
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isEditMode, submitMutation.isPending, isHelpOpen],
    ),
    !isHelpOpen,
  );

  const displayTask = item
    ? savedEdits
      ? { ...item.task, ...savedEdits }
      : item.task
    : null;

  if (isLoading) {
    return (
      <div className="animate-pulse p-6 space-y-4">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-40 rounded bg-muted" />
      </div>
    );
  }

  if (isError || !item || !displayTask) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Зүйл олдсонгүй.
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm text-muted-foreground truncate">{item.task.task_id}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">{item.task.task_type}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ShortcutsHelpButton onClick={() => setIsHelpOpen(true)} />
          <DialogClose className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </DialogClose>
        </div>
      </DialogHeader>

      <DialogBody className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">
          <TaskPreview
            task={displayTask}
            variantId={item.variant_id}
            isEditMode={isEditMode}
            isSaving={updateMutation.isPending}
            editDraft={editDraft}
            onEnterEdit={handleEnterEdit}
            onDraftChange={(patch) => setEditDraft((prev) => ({ ...prev, ...patch }))}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onMediaAccepted={() => queryClient.invalidateQueries({ queryKey: ["review-item", id] })}
          />
          <ReviewPanel
            ref={reviewPanelRef}
            item={item}
            isEditMode={isEditMode}
            isSaving={updateMutation.isPending}
            savedEdits={savedEdits}
            onSubmit={handleSubmit}
            onSaveEdit={handleSaveEdit}
            isPending={submitMutation.isPending}
          />
        </div>
      </DialogBody>

      <KeyboardShortcutsHelp open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300",
          toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
        )}
      >
        {toast.message}
      </div>
    </>
  );
}

export function ReviewDetailModal() {
  const { reviewDetailId, closeReviewDetail } = useModalStore();
  const isOpen = reviewDetailId !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeReviewDetail(); }}>
      <DialogContent size="fullscreen">
        {isOpen && reviewDetailId && (
          <ReviewDetailContent id={reviewDetailId} onClose={closeReviewDetail} />
        )}
      </DialogContent>
    </Dialog>
  );
}

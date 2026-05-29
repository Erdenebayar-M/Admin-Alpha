'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useReviewItem, useSubmitReview } from '@/hooks/useReviewItem';
import { useUpdateTaskContent } from '@/hooks/useTaskActions';
import { useHotkeys } from '@/hooks/useHotkeys';
import { TaskPreview } from '@/components/review/TaskPreview';
import { ReviewPanel, type ReviewPanelRef } from '@/components/review/ReviewPanel';
import {
  KeyboardShortcutsHelp,
  ShortcutsHelpButton,
} from '@/components/review/KeyboardShortcutsHelp';
import type { ReviewAction, TaskContent } from '@/lib/types';

const TOAST_MESSAGES: Record<ReviewAction['action'], string> = {
  approve: 'Даалгавар батлагдлаа.',
  reject: 'Даалгавар татгалзагдлаа.',
  request_revision: '',
};

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: item, isLoading, isError } = useReviewItem(id);

  // Edit state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<TaskContent>>({});
  const [savedEdits, setSavedEdits] = useState<Partial<TaskContent> | null>(null);

  // Help modal
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
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
      title: item.task.title,
      prompt_text: item.task.prompt_text,
      correct_answer: item.task.correct_answer,
      feedback_text: item.task.feedback_text,
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
        showToast('Даалгавар шинэчлэгдлаа — батлахад бэлэн');
      },
    });
  }, [editDraft, updateMutation, showToast]);

  const handleSubmit = useCallback(
    (action: ReviewAction) => {
      submitMutation.mutate(action, {
        onSuccess: () => {
          showToast(TOAST_MESSAGES[action.action], 2000);
          setTimeout(() => router.push('/admin/review'), 300);
        },
      });
    },
    [submitMutation, router, showToast],
  );

  // Keyboard shortcuts — disabled while help modal is open
  useHotkeys(
    useMemo(
      () => ({
        a: () => {
          if (!isEditMode && !submitMutation.isPending) {
            reviewPanelRef.current?.triggerAction('approve');
          }
        },
        r: () => reviewPanelRef.current?.focusNote(),
        x: () => reviewPanelRef.current?.triggerAction('reject'),
        e: () => (isEditMode ? handleCancelEdit() : handleEnterEdit()),
        escape: () => router.push('/admin/review'),
        '?': () => setIsHelpOpen(true),
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isEditMode, submitMutation.isPending],
    ),
    !isHelpOpen,
  );

  // Merge saved edits into displayed task for TaskPreview
  const displayTask = item
    ? savedEdits
      ? { ...item.task, ...savedEdits }
      : item.task
    : null;

  if (isLoading) return <ReviewDetailSkeleton />;

  if (isError || !item || !displayTask) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Зүйл олдсонгүй.</p>
        <Link
          href="/admin/review"
          className="text-sm underline text-muted-foreground hover:text-foreground"
        >
          Дараалал руу буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header: breadcrumb + help */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
          <Link href="/admin/review" className="hover:text-foreground transition-colors shrink-0">
            Хяналтын дараалал
          </Link>
          <span className="shrink-0">/</span>
          <span className="font-mono text-foreground truncate">{item.task.task_id}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ShortcutsHelpButton onClick={() => setIsHelpOpen(true)} />
        </div>
      </div>

      {/* 2-col layout on md+, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">
        <TaskPreview
          task={displayTask}
          variantId={item.variant_id}
          createdAt={item.created_at}
          isEditMode={isEditMode}
          isSaving={updateMutation.isPending}
          editDraft={editDraft}
          onEnterEdit={handleEnterEdit}
          onDraftChange={(patch) => setEditDraft((prev) => ({ ...prev, ...patch }))}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onMediaAccepted={() => queryClient.invalidateQueries({ queryKey: ['review-item', id] })}
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

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsHelp open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Toast */}
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300',
          toast.visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none',
        )}
      >
        {toast.message}
      </div>
    </div>
  );
}

function ReviewDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-7 w-7 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-16 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-muted" />
            ))}
          </div>
          <div className="h-8 rounded bg-muted" />
          <div className="h-8 rounded bg-muted" />
        </div>
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5 h-40" />
          <div className="rounded-lg border border-border bg-card p-5 h-28" />
          <div className="rounded-lg border border-border bg-card p-5 h-40" />
        </div>
      </div>
    </div>
  );
}

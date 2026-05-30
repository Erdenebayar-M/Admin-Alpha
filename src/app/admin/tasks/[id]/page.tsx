"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getLiveTask, updateLiveTask, deleteLiveTask } from "@/lib/api";
import { TaskPreview } from "@/components/review/TaskPreview";
import type { TaskContent } from "@/lib/types";

export default function LiveTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<TaskContent>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showToast = useCallback((message: string, duration = 2500) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, []);

  const { data: task, isLoading, isError } = useQuery({
    queryKey: ["live-task", id],
    queryFn: () => getLiveTask(id),
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: (updates: Partial<TaskContent>) => updateLiveTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-task", id] });
      queryClient.invalidateQueries({ queryKey: ["live-tasks"] });
      setIsEditMode(false);
      setEditDraft({});
      showToast("Хадгалагдлаа.");
    },
    onError: (err) => showToast((err as Error).message ?? "Алдаа гарлаа."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLiveTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-tasks"] });
      router.push("/admin/tasks");
    },
    onError: (err) => showToast((err as Error).message ?? "Устгаж чадсангүй."),
  });

  const handleEnterEdit = useCallback(() => {
    if (!task) return;
    setEditDraft({
      title: task.title,
      prompt_text: task.prompt_text,
      correct_answer: task.correct_answer,
      feedback_text: task.feedback_text,
      feedback_correct: task.feedback_correct ?? '',
      feedback_wrong: task.feedback_wrong ?? '',
    });
    setIsEditMode(true);
  }, [task]);

  const handleCancelEdit = useCallback(() => {
    setEditDraft({});
    setIsEditMode(false);
  }, []);

  const handleSave = useCallback(() => {
    saveMutation.mutate(editDraft);
  }, [editDraft, saveMutation]);

  const handleDeleteClick = useCallback(() => {
    if (confirmDelete) {
      deleteMutation.mutate();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }, [confirmDelete, deleteMutation]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !task) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">Даалгавар олдсонгүй.</p>
        <Link href="/admin/tasks" className="text-sm underline text-muted-foreground hover:text-foreground">
          Буцах
        </Link>
      </div>
    );
  }

  const displayTask = isEditMode ? { ...task, ...editDraft } : task;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
          <Link href="/admin/tasks" className="hover:text-foreground transition-colors shrink-0">
            Даалгаврууд
          </Link>
          <span>/</span>
          <span className="font-mono text-foreground truncate">{task.task_type}</span>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Task preview (reused component) */}
        <TaskPreview
          task={displayTask}
          variantId={id}
          createdAt={task.created_at}
          showSaveInHeader
          mediaStage="validated"
          isEditMode={isEditMode}
          isSaving={saveMutation.isPending}
          editDraft={editDraft}
          onEnterEdit={handleEnterEdit}
          onDraftChange={(patch) => setEditDraft((prev) => ({ ...prev, ...patch }))}
          onSaveEdit={handleSave}
          onCancelEdit={handleCancelEdit}
          onMediaAccepted={() => queryClient.invalidateQueries({ queryKey: ["live-task", id] })}
        />

        {/* Action sidebar */}
        <div className="space-y-3">
          {/* Delete */}
          {!isEditMode && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Устгах</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleteMutation.isPending}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                    confirmDelete
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "border border-border text-red-500 hover:border-red-400 hover:bg-red-50",
                  )}
                >
                  {deleteMutation.isPending ? "Устгаж байна…" : confirmDelete ? "Баталгаажуулах" : "Устгах"}
                </button>
                {confirmDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Болих
                  </button>
                )}
              </div>
              {confirmDelete && (
                <p className="text-xs text-red-500">Энэ үйлдлийг буцаах боломжгүй.</p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300",
          toast.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none",
        )}
      >
        {toast.message}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      <div className="mb-6 h-4 w-48 rounded bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-16 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded bg-muted" />)}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-24 rounded-lg border border-border bg-card" />
          <div className="h-20 rounded-lg border border-border bg-card" />
          <div className="h-28 rounded-lg border border-border bg-card" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/lib/modal-store";
import { getLiveTask, updateLiveTask, deleteLiveTask } from "@/lib/api";
import { TaskPreview } from "@/components/review/TaskPreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog";
import type { TaskContent } from "@/lib/types";

function TaskDetailContent({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { showPageToast } = useModalStore();

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
      showPageToast({ message: "Даалгавар устгагдлаа.", type: "success" });
      onClose();
    },
    onError: (err) => showPageToast({ message: (err as Error).message ?? "Устгаж чадсангүй.", type: "error" }),
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

  if (isLoading) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="sr-only">Даалгаврын дэлгэрэнгүй</DialogTitle>
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <DialogClose className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </DialogClose>
        </DialogHeader>
        <DialogBody className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-muted" />
              ))}
            </div>
          </div>
        </DialogBody>
      </>
    );
  }

  if (isError || !task) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="sr-only">Даалгаврын дэлгэрэнгүй</DialogTitle>
          <span className="text-sm text-muted-foreground">Даалгавар</span>
          <DialogClose className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </DialogClose>
        </DialogHeader>
        <DialogBody className="p-8 text-center text-sm text-muted-foreground">
          Даалгавар олдсонгүй.
        </DialogBody>
      </>
    );
  }

  const displayTask = isEditMode ? { ...task, ...editDraft } : task;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="sr-only">{task.task_type} — {task.task_id}</DialogTitle>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm text-muted-foreground truncate">{task.task_id}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm font-medium">{task.task_type}</span>
          <div className="flex gap-1 ml-1">
            {task.grade_band.map((g) => (
              <span key={g} className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {g}
              </span>
            ))}
          </div>
        </div>
        <DialogClose className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </DialogClose>
      </DialogHeader>

      <DialogBody className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 items-start">
          {/* Task preview */}
          <TaskPreview
            task={displayTask}
            variantId={id}
            isEditMode={isEditMode}
            isSaving={saveMutation.isPending}
            editDraft={editDraft}
            onEnterEdit={handleEnterEdit}
            onDraftChange={(patch) => setEditDraft((prev) => ({ ...prev, ...patch }))}
            onSaveEdit={handleSave}
            onCancelEdit={handleCancelEdit}
            onMediaAccepted={() => queryClient.invalidateQueries({ queryKey: ["live-task", id] })}
          />

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Edit / Save / Cancel */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Засах</p>
              {isEditMode ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {saveMutation.isPending ? "Хадгалж байна…" : "Хадгалах"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Болих
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEnterEdit}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Засварлах
                </button>
              )}
            </div>

            {/* Meta info */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Чадвар</span>
                <span className="text-foreground font-medium">{task.primary_skill}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Хүндрэл</span>
                <span className="text-yellow-500">{"★".repeat(task.difficulty)}{"☆".repeat(5 - task.difficulty)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Цаг</span>
                <span className="text-foreground font-medium">{task.estimated_time_seconds}с</span>
              </div>
              {task.is_diagnostic && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Оношилгоо</span>
                  <span className="text-foreground font-medium">Тийм</span>
                </div>
              )}
            </div>

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
                      "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                      confirmDelete
                        ? "bg-[#DC2B33] text-white hover:bg-[#90251D]"
                        : "border border-border text-[#DC2B33] hover:border-[#DC2B33]/50 hover:bg-[#DC2B33]/5",
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
                  <p className="text-xs text-[#DC2B33]">Энэ үйлдлийг буцаах боломжгүй.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogBody>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300",
          toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
        )}
      >
        {toast.message}
      </div>
    </>
  );
}

export function TaskDetailModal() {
  const { taskDetailId, closeTaskDetail } = useModalStore();
  const isOpen = taskDetailId !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeTaskDetail(); }}>
      <DialogContent size="fullscreen">
        {isOpen && taskDetailId && (
          <TaskDetailContent id={taskDetailId} onClose={closeTaskDetail} />
        )}
      </DialogContent>
    </Dialog>
  );
}

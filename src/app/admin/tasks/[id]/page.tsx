"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getLiveTask, deleteLiveTask, updateLiveTask } from "@/lib/api";
import { TaskPreview } from "@/components/review/TaskPreview";
import { PageHeader } from "@/components/ui/page-header";
import { ExerciseInfoCard } from "@/components/ui/exercise-info-card";

export default function LiveTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const deactivateMutation = useMutation({
    mutationFn: () => deleteLiveTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["live-task", id] });
      showToast("Идэвхгүй болгогдлоо.");
    },
    onError: (err) => showToast((err as Error).message ?? "Алдаа гарлаа."),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => updateLiveTask(id, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["live-task", id] });
      showToast("Дахин идэвхжүүлэгдлээ.");
    },
    onError: (err) => showToast((err as Error).message ?? "Алдаа гарлаа."),
  });

  const handleDeactivateClick = useCallback(() => {
    if (confirmDelete) {
      deactivateMutation.mutate();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }, [confirmDelete, deactivateMutation]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !task) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="mb-3 text-muted-foreground">Даалгавар олдсонгүй.</p>
        <Link href="/admin/tasks" className="text-sm text-primary hover:underline">Буцах</Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Даалгаврууд", href: "/admin/tasks" },
          { label: task.task_id },
        ]}
        title={task.task_id}
      />

      <div className="px-4 py-6 sm:px-6">
      {/* 2-col layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Task preview (reused component) */}
        <TaskPreview
          task={task}
          variantId={id}
          createdAt={task.created_at}
          mediaStage="validated"
          readOnly
          isEditMode={false}
          onMediaAccepted={() => queryClient.invalidateQueries({ queryKey: ["live-task", id] })}
        />

        {/* Action sidebar */}
        <div className="space-y-3">
          <ExerciseInfoCard task={task} />

          {/* Active / deactivate */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Төлөв</p>
            {task.is_active ? (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeactivateClick}
                    disabled={deactivateMutation.isPending}
                    className={cn(
                      "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                      confirmDelete
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "border border-border text-red-500 hover:border-red-400 hover:bg-red-50",
                    )}
                  >
                    {deactivateMutation.isPending ? "Хадгалж байна…" : confirmDelete ? "Баталгаажуулах" : "Идэвхгүй болгох"}
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
                  <p className="text-xs text-muted-foreground">Дараа нь дахин идэвхжүүлж болно.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-amber-600 font-medium">Одоогоор идэвхгүй байна.</p>
                <button
                  type="button"
                  onClick={() => reactivateMutation.mutate()}
                  disabled={reactivateMutation.isPending}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {reactivateMutation.isPending ? "Хадгалж байна…" : "Дахин идэвхжүүлэх"}
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300",
          toast.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none",
        )}
        role="status"
        aria-live="polite"
      >
        {toast.message}
      </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="px-4 py-8 sm:px-6 animate-pulse">
      <div className="mb-6 h-4 w-48 rounded bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
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

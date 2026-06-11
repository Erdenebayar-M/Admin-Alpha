"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTaskForm } from "@/hooks/useTaskForm";
import { GRADE_CODES, GRADE_LABELS, ERROR_GROUPS, ERROR_LABELS } from "@/lib/task-defaults";
import { TaskTypeSelector } from "@/components/tasks/TaskTypeSelector";
import { ClassificationForm } from "@/components/tasks/ClassificationForm";
import { ContentForm } from "@/components/tasks/ContentForm";
import { TaskPreviewCard } from "@/components/tasks/TaskPreviewCard";
import { TemplateManager } from "@/components/tasks/TemplateManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function ErrorTypesList({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Алдааны төрөл</span>
          {selected.length > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
              {selected.length}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {!open && (
        <p className="px-6 pb-4 text-[11px] text-muted-foreground">
          {selected.length === 0
            ? "Даалгаврын төрлөөс автоматаар тогтооно. Гараар өөрчлөх боломжтой."
            : selected.join(", ")}
        </p>
      )}

      {open && (
        <CardContent className="animate-in fade-in-0 slide-in-from-top-2 duration-200 border-t border-border pt-4">
          <div className="divide-y divide-border">
          {ERROR_GROUPS.map((group) => (
            <div key={group.key} className="py-3 first:pt-0 last:pb-0">
              <p className="mb-1 px-2 text-sm font-bold text-foreground">
                {group.label} — {group.description}
              </p>
              <div>
                {group.codes.map((code) => {
                  const active = selected.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onToggle(code)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-2 text-left transition-colors",
                        active ? "bg-green-50 dark:bg-green-950/30" : "hover:bg-muted/50",
                      )}
                    >
                      <span className={cn(
                        "w-3 shrink-0 text-xs font-bold",
                        active ? "text-green-600" : "text-transparent select-none",
                      )}>✓</span>
                      <span className={cn(
                        "text-sm",
                        active ? "font-semibold text-green-900 dark:text-green-100" : "text-foreground",
                      )}>
                        {code} — {ERROR_LABELS[code]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        </CardContent>
      )}
    </Card>
  );
}

const STEPS = [
  { label: "Төрөл & Ангилал", description: "Даалгаврын төрөл, анги, чадвар" },
  { label: "Дасгалын тайлбар", description: "Текст, хариулт, тохиргоо" },
  { label: "Хянах & Илгээх", description: "Шалгаж илгээх" },
] as const;

interface CreateTaskPanelProps {
  onClose: () => void;
}

export function CreateTaskPanel({ onClose }: CreateTaskPanelProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const tf = useTaskForm();

  const goNext = useCallback(() => {
    if (tf.validateStep(step)) {
      setStep((s) => Math.min(s + 1, 2));
    }
  }, [step, tf]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback(
    (s: number) => {
      if (s <= step) setStep(s);
    },
    [step],
  );

  const handleSubmit = useCallback(() => {
    tf.setShowErrors(true);
    if (!tf.canSubmit) return;
    tf.submit(undefined, {
      onSuccess: (result) => {
        setToast({ msg: `Хяналтанд илгээгдлээ: ${result.task_id}`, ok: true });
        queryClient.invalidateQueries({ queryKey: ["review-queue"] });
        queryClient.invalidateQueries({ queryKey: ["content-stats"] });
        setTimeout(() => onClose(), 1500);
      },
      onError: (err: Error) => {
        setToast({ msg: err.message ?? "Алдаа гарлаа.", ok: false });
        setTimeout(() => setToast(null), 4000);
      },
    });
  }, [tf, queryClient, onClose]);

  const handleStartNew = useCallback(() => {
    tf.reset();
    setStep(0);
  }, [tf]);

  return (
    <div className="relative">
      {/* Template bar */}
      <div className="mb-5">
        <TemplateManager
          onLoadTemplate={tf.loadFromTemplate}
          onDuplicateLast={tf.duplicateLastTask}
          currentForm={tf.form}
          showSaveOption={tf.isSuccess}
        />
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((s, i) => {
          const isCompleted = i < step;
          const isCurrent = i === step;
          const isDisabled = i > step;
          return (
            <div key={i} className="flex items-center">
              <button
                type="button"
                onClick={() => goToStep(i)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                  isCurrent && "bg-primary/10",
                  isDisabled && "opacity-40 cursor-not-allowed",
                  isCompleted && !isCurrent && "cursor-pointer hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted && !isCurrent ? "✓" : i + 1}
                </span>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium leading-tight">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.description}</p>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-1 h-px w-6 sm:w-10", isCompleted ? "bg-green-600" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <form onSubmit={(e) => e.preventDefault()}>
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* Left column */}
            <div className="space-y-4">
              {/* Grade band card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ангийн бүлэг <span className="text-destructive">*</span></CardTitle>
                </CardHeader>
                <CardContent>
                  {tf.errors.grade_band && (
                    <p className="mb-2 text-xs text-destructive">{tf.errors.grade_band}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {GRADE_CODES.map((g) => {
                      const selected = tf.form.grade_band.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => tf.toggleGradeBand(g)}
                          className={cn(
                            "rounded-lg border px-5 py-3 text-sm font-semibold transition-all",
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary text-foreground"
                              : "border-border hover:border-foreground/20 hover:bg-muted/50 text-muted-foreground",
                          )}
                        >
                          {GRADE_LABELS[g]}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Task type card */}
              {tf.form.grade_band.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Даалгаврын төрөл <span className="text-destructive">*</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tf.errors.task_type && (
                      <p className="mb-2 text-xs text-destructive">{tf.errors.task_type}</p>
                    )}
                    <TaskTypeSelector
                      value={tf.form.task_type}
                      onChange={tf.setTaskType}
                      selectedGrades={tf.form.grade_band}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Error types card — beneath task type */}
              {tf.form.task_type && (
                <ErrorTypesList
                  selected={tf.form.error_targets}
                  onToggle={(code) => tf.toggleList("error_targets", code)}
                />
              )}
            </div>

            {/* Right column: classification metadata */}
            {tf.form.task_type && (
              <ClassificationForm
                form={tf.form}
                set={tf.set}
                errors={tf.errors}
              />
            )}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            <Card>
              <CardHeader>
                <CardTitle>Дасгалын тайлбар</CardTitle>
                <CardDescription>
                  {tf.typeInfo
                    ? `${tf.typeInfo.shortLabel} — ${tf.typeInfo.label}: ${tf.typeInfo.description}`
                    : "Даалгаврын агуулга оруулна уу"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentForm
                  form={tf.form}
                  set={tf.set}
                  toggleList={tf.toggleList}
                  groups={tf.groups}
                  errors={tf.errors}
                  taskType={tf.form.task_type}
                  audioPreview={tf.audioPreview}
                  onAudioGenerated={tf.setAudioPreview}
                  imagePreview={tf.imagePreview}
                  onImageGenerated={tf.setImagePreview}
                />
              </CardContent>
            </Card>
            <ClassificationForm form={tf.form} set={tf.set} errors={tf.errors} />
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            <Card>
              <CardHeader>
                <CardTitle>Хянах & Илгээх</CardTitle>
                <CardDescription>Бүх мэдээллийг шалгаж, илгээнэ үү</CardDescription>
              </CardHeader>
              <CardContent>
                <TaskPreviewCard
                  form={tf.form}
                  groups={tf.groups}
                  taskType={tf.form.task_type}
                  onGoToStep={goToStep}
                />
              </CardContent>
            </Card>
            <ClassificationForm form={tf.form} set={tf.set} errors={tf.errors} />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between pb-4">
          <div>
            {step > 0 && (
              <Button type="button" variant="outline" onClick={goBack}>
                ← Өмнөх
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={handleStartNew}>
              Цэвэрлэх
            </Button>
            {step < 2 && (
              <Button type="button" onClick={goNext}>
                Дараах →
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!tf.canSubmit || tf.isPending}
              >
                {tf.isPending ? "Үүсгэж байна…" : "Даалгавар үүсгэх"}
              </Button>
            )}
          </div>
        </div>
      </form>

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg",
            toast.ok ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground",
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/lib/modal-store";
import { useTaskForm } from "@/hooks/useTaskForm";
import { TaskTypeSelector } from "@/components/tasks/TaskTypeSelector";
import { ClassificationForm } from "@/components/tasks/ClassificationForm";
import { ContentForm } from "@/components/tasks/ContentForm";
import { TaskPreviewCard } from "@/components/tasks/TaskPreviewCard";
import { TemplateManager } from "@/components/tasks/TemplateManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogBody,
} from "@/components/ui/dialog";

const STEPS = [
  { label: "Төрөл & Ангилал", description: "Даалгаврын төрөл, анги, чадвар" },
  { label: "Агуулга", description: "Текст, хариулт, тохиргоо" },
  { label: "Хянах & Илгээх", description: "Шалгаж илгээх" },
] as const;

function CreateTaskContent({ onClose }: { onClose: () => void }) {
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
        setToast({ msg: `Даалгавар үүсгэгдлээ: ${result.task_id}`, ok: true });
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
    <>
      <DialogHeader>
        <DialogTitle>Даалгавар гараар нэмэх</DialogTitle>
        <DialogClose className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </DialogClose>
      </DialogHeader>

      <DialogBody className="p-6">
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
            <Card>
              <CardHeader>
                <CardTitle>Даалгаврын төрөл</CardTitle>
                <CardDescription>Анги сонгоод даалгаврын төрлийг тодорхойлно уу</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Ангийн бүлэг <span className="text-destructive">*</span>
                  </p>
                  {tf.errors.grade_band && (
                    <p className="mb-2 text-xs text-destructive">{tf.errors.grade_band}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { gb: "G12", title: "1–2-р анги", desc: "Эхлэгч — суурь үсэг, эгшиг, богино диктант (16 төрөл)" },
                        { gb: "G24", title: "2–4-р анги", desc: "Дунд — залгавар, урт эгшиг, мини диктант (23 төрөл)" },
                      ] as const
                    ).map(({ gb, title, desc }) => {
                      const selected = tf.form.grade_band.includes(gb);
                      return (
                        <button
                          key={gb}
                          type="button"
                          onClick={() => tf.setGradeBand(gb)}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all",
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary"
                              : "border-border hover:border-foreground/20 hover:bg-muted/50",
                          )}
                        >
                          <span className="font-semibold text-sm">{title}</span>
                          <span className="text-[11px] leading-snug text-muted-foreground">{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {tf.form.grade_band.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Даалгаврын төрөл <span className="text-destructive">*</span>
                    </p>
                    {tf.errors.task_type && (
                      <p className="mb-2 text-xs text-destructive">{tf.errors.task_type}</p>
                    )}
                    <TaskTypeSelector
                      value={tf.form.task_type}
                      onChange={tf.setTaskType}
                      gradeBand={tf.form.grade_band[0]}
                    />
                  </div>
                )}
                {tf.form.task_type && (
                  <ClassificationForm
                    form={tf.form}
                    set={tf.set}
                    toggleList={tf.toggleList}
                    errors={tf.errors}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Агуулга</CardTitle>
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
          )}

          {step === 2 && (
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
      </DialogBody>

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
    </>
  );
}

export function CreateTaskModal() {
  const { openCreate, setOpenCreate } = useModalStore();

  return (
    <Dialog open={openCreate} onOpenChange={setOpenCreate}>
      <DialogContent size="large">
        {openCreate && <CreateTaskContent onClose={() => setOpenCreate(false)} />}
      </DialogContent>
    </Dialog>
  );
}

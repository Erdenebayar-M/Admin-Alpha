"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTaskForm } from "@/hooks/useTaskForm";
import { TaskTypeSelector } from "@/components/tasks/TaskTypeSelector";
import { ClassificationForm } from "@/components/tasks/ClassificationForm";
import { ContentForm } from "@/components/tasks/ContentForm";
import { TaskPreviewCard } from "@/components/tasks/TaskPreviewCard";
import { TemplateManager } from "@/components/tasks/TemplateManager";

const STEPS = [
  { label: "Төрөл & Ангилал", description: "Даалгаврын төрөл, анги, чадвар" },
  { label: "Агуулга", description: "Текст, хариулт, тохиргоо" },
  { label: "Хянах & Илгээх", description: "Шалгаж илгээх" },
] as const;

export default function CreateTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const tf = useTaskForm();

  const maxNavigableStep = step;

  const goNext = useCallback(() => {
    if (tf.validateStep(step)) {
      setStep((s) => Math.min(s + 1, 2));
    }
  }, [step, tf]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((s: number) => {
    if (s <= maxNavigableStep) setStep(s);
  }, [maxNavigableStep]);

  const handleSubmit = useCallback(() => {
    tf.setShowErrors(true);
    if (!tf.canSubmit) return;
    tf.submit(undefined, {
      onSuccess: (result) => {
        setToast({ msg: `Даалгавар үүсгэгдлээ: ${result.task_id}`, ok: true });
        setTimeout(() => {
          router.push("/admin/review");
        }, 1500);
      },
      onError: (err: Error) => {
        setToast({ msg: err.message ?? "Алдаа гарлаа.", ok: false });
        setTimeout(() => setToast(null), 4000);
      },
    });
  }, [tf, router]);

  const handleStartNew = useCallback(() => {
    tf.reset();
    setStep(0);
  }, [tf]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Даалгавар үүсгэх</h1>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/admin/review")}>
          ← Буцах
        </Button>
      </div>

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
                <div className={cn(
                  "mx-1 h-px w-6 sm:w-10",
                  isCompleted ? "bg-green-600" : "bg-border",
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error indicator for steps */}
      {tf.stepErrors[0] && step !== 0 && tf.errors.task_type && (
        <p className="mb-3 text-xs text-destructive">Алхам 1-д алдаа байна</p>
      )}
      {tf.stepErrors[1] && step !== 1 && Object.keys(tf.errors).some(k => ["title", "prompt_text", "correct_answer"].includes(k)) && (
        <p className="mb-3 text-xs text-destructive">Алхам 2-д алдаа байна</p>
      )}

      {/* Step content */}
      <form onSubmit={(e) => e.preventDefault()}>
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Даалгаврын төрөл</CardTitle>
              <CardDescription>Анги сонгоод даалгаврын төрлийг тодорхойлно уу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grade band selector — shown first */}
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

              {/* Task type grid — shown after grade is selected */}
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

              {/* Classification fields — shown after task type is selected */}
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
        <div className="mt-4 flex items-center justify-between pb-8">
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

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg",
            toast.ok ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground",
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

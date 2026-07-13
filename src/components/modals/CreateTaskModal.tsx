"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTaskForm } from "@/hooks/useTaskForm";
import { GRADE_CODES, GRADE_LABELS } from "@/lib/task-defaults";
import { TaskTypeSelector } from "@/components/tasks/TaskTypeSelector";
import { ClassificationForm } from "@/components/tasks/ClassificationForm";
import { ContentForm, IMAGE_CAPABLE_TASK_TYPES } from "@/components/tasks/ContentForm";
import { MetadataSection } from "@/components/tasks/forms/sections";
import { WordSuggestions } from "@/components/tasks/WordSuggestions";
import { TaskPreviewCard } from "@/components/tasks/TaskPreviewCard";
import { TemplateManager } from "@/components/tasks/TemplateManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
        const warningLabels: Record<string, string> = {
          audio: "аудио", image: "зураг", "word-audio": "үгийн сангийн аудио",
        };
        const msg = result.mediaWarnings?.length
          ? `Хяналтанд илгээгдлээ: ${result.task_id} · Хадгалагдсангүй: ${result.mediaWarnings.map((w) => warningLabels[w] ?? w).join(", ")} — review хэсгээс дахин оролдоно уу`
          : `Хяналтанд илгээгдлээ: ${result.task_id}`;
        setToast({ msg, ok: !result.mediaWarnings?.length });
        queryClient.invalidateQueries({ queryKey: ["review-queue"] });
        queryClient.invalidateQueries({ queryKey: ["content-stats"] });
        setTimeout(() => onClose(), result.mediaWarnings?.length ? 3500 : 1500);
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

            </div>

            {/* Right column: classification metadata */}
            {tf.form.task_type && (
              <ClassificationForm
                form={tf.form}
                set={tf.set}
                toggleList={tf.toggleList}
                errors={tf.errors}
              />
            )}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_300px] gap-6 items-start">
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
                  selectedWordId={tf.selectedWordId}
                  onSelectWord={tf.setSelectedWordId}
                  saveAudioToWord={tf.saveAudioToWord}
                  onSaveAudioToWordChange={tf.setSaveAudioToWord}
                />
              </CardContent>
            </Card>
            {tf.form.grade_band.length > 0 && tf.form.task_type && (
              <WordSuggestions
                gradeBand={tf.form.grade_band}
                taskType={tf.form.task_type}
                skill={tf.form.primary_skill || undefined}
                secondarySkill={tf.form.secondary_skill || undefined}
                appLevel={tf.form.level_target || undefined}
                difficulty={tf.form.difficulty ? Number(tf.form.difficulty) : undefined}
                selectedWordId={tf.selectedWordId}
                onSelectWord={tf.setSelectedWordId}
                showImageAction={IMAGE_CAPABLE_TASK_TYPES.has(tf.form.task_type)}
                onUseImage={(word) => tf.setImagePreview({ tempId: "", base64: "", url: word.image_url ?? undefined })}
              />
            )}
            <div className="space-y-4">
              <ClassificationForm form={tf.form} set={tf.set} toggleList={tf.toggleList} errors={tf.errors} />
              <MetadataSection form={tf.form} set={tf.set} toggleList={tf.toggleList} groups={tf.groups} />
            </div>
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
                  audioPreview={tf.audioPreview}
                  imagePreview={tf.imagePreview}
                />
              </CardContent>
            </Card>
            <ClassificationForm form={tf.form} set={tf.set} toggleList={tf.toggleList} errors={tf.errors} />
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

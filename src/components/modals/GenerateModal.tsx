"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  getGenerateSpecs,
  generateTasks,
  type GenerateSpec,
} from "@/lib/api";
import {
  SKILL_LABELS,
  TASK_TYPE_INFO,
  deriveInteractionForm,
  INTERACTION_FORM_LABELS,
} from "@/lib/task-defaults";
import { DifficultyDots } from "@/components/ui/difficulty-dots";

type GradeFilter = "G1" | "G2" | "G3" | "G4" | "all";

const GRADE_LABELS: Record<string, string> = {
  G1: "1-р анги",
  G2: "2-р анги",
  G3: "3-р анги",
  G4: "4-р анги",
};

const SKILL_ORDER = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

function gradeLabel(grades: string[]): string {
  return grades.map((g) => GRADE_LABELS[g] ?? g).join(", ");
}

function ToggleChip<T extends string | number>({
  value,
  active,
  onClick,
  children,
}: {
  value: T;
  active: boolean;
  onClick: (v: T) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SpecRow({
  spec,
  selected,
  onToggle,
}: {
  spec: GenerateSpec;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const form = deriveInteractionForm(spec.task_type);
  const formLabel = form ? INTERACTION_FORM_LABELS[form] : null;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded px-2 py-2 transition-colors",
        selected ? "bg-green-50 dark:bg-green-950/30" : "hover:bg-muted/50",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(spec.id)}
        className="h-4 w-4 shrink-0 accent-green-600"
      />
      <div className="flex flex-1 min-w-0 items-center gap-2 flex-wrap">
        <p className={cn(
          "text-sm leading-tight",
          selected ? "font-semibold text-green-900 dark:text-green-100" : "text-foreground",
        )}>
          {spec.mongolian_name}
        </p>
        {formLabel && (
          <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
            {formLabel}
          </span>
        )}
        <DifficultyDots n={spec.difficulty} />
      </div>
    </label>
  );
}

export function GeneratePanel() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [maxItems, setMaxItems] = useState<1 | 2 | 3>(3);
  const [maxCost, setMaxCost] = useState<1 | 5 | 10 | 20>(5);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const { data: specs = [], isLoading } = useQuery({
    queryKey: ["generate-specs"],
    queryFn: getGenerateSpecs,
  });

  const filteredSpecs = useMemo(
    () =>
      gradeFilter === "all"
        ? specs
        : specs.filter((s) => s.grade_band.includes(gradeFilter)),
    [specs, gradeFilter],
  );

  function toggleSpec(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectByGrade(grade: GradeFilter) {
    const ids =
      grade === "all"
        ? specs.map((s) => s.id)
        : specs.filter((s) => s.grade_band.includes(grade)).map((s) => s.id);
    setSelectedIds((prev) => new Set([...prev, ...ids]));
  }

  const mutation = useMutation({
    mutationFn: () => generateTasks([...selectedIds], maxItems, maxCost),
    onSuccess: (data) => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
      const total = data.results.reduce((s, r) => s + r.drafts_created, 0);
      setToast({ msg: `${total} даалгавар амжилттай үүсгэгдлээ`, ok: true });
      setTimeout(() => router.push("/admin/review"), 1500);
    },
    onError: (err: Error) => {
      setToast({ msg: err.message ?? "Үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.", ok: false });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const hasSelection = selectedIds.size > 0;
  const estimatedVariants = selectedIds.size * maxItems;

  if (mutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <svg className="h-10 w-10 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="mt-5 text-base font-medium text-foreground">Даалгавар үүсгэж байна…</p>
        <p className="mt-1.5 text-sm text-muted-foreground">Нэг минут орчим болж болно</p>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="mt-4 text-base font-medium text-foreground">Үүсгэхэд алдаа гарлаа</p>
        <p className="mt-1.5 text-sm text-muted-foreground">Дахин оролдоно уу</p>
        <button
          type="button"
          onClick={() => mutation.reset()}
          className="mt-5 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Дахин оролдох
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Даалгавар бүрт хувилбарын тоо</p>
          <div className="flex gap-1">
            {([1, 2, 3] as const).map((n) => (
              <ToggleChip key={n} value={n} active={maxItems === n} onClick={setMaxItems}>
                {n}
              </ToggleChip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Хамгийн их зардлын хязгаар</p>
          <div className="flex gap-1">
            {([1, 5, 10, 20] as const).map((n) => (
              <ToggleChip key={n} value={n} active={maxCost === n} onClick={setMaxCost}>
                ${n}
              </ToggleChip>
            ))}
          </div>
        </div>
      </div>

      {/* Grade filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ToggleChip value={"all" as GradeFilter} active={gradeFilter === "all"} onClick={setGradeFilter}>
          Бүгд
        </ToggleChip>
        {(["G1", "G2", "G3", "G4"] as const).map((g) => (
          <ToggleChip key={g} value={g} active={gradeFilter === g} onClick={setGradeFilter}>
            {GRADE_LABELS[g]}
          </ToggleChip>
        ))}
      </div>

      {/* Select shortcuts */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["G1", "G2", "G3", "G4"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => selectByGrade(g)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
          >
            {GRADE_LABELS[g]} бүгд
          </button>
        ))}
        <button
          type="button"
          onClick={() => selectByGrade("all")}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
        >
          Бүгдийг сонгох
        </button>
        {hasSelection && (
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-red-400 hover:text-red-500"
          >
            Цэвэрлэх
          </button>
        )}
      </div>

      {/* Spec grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted" />
          ))}
        </div>
      ) : filteredSpecs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Тохирох даалгавар олдсонгүй
        </p>
      ) : (
        <div className="divide-y divide-border">
          {SKILL_ORDER
            .map((skill) => ({
              skill,
              specs: filteredSpecs.filter((s) => s.primary_skill === skill),
            }))
            .filter((g) => g.specs.length > 0)
            .map(({ skill, specs }) => (
              <div key={skill} className="py-3 first:pt-0 last:pb-0">
                <p className="mb-1 px-2 text-sm font-bold text-foreground">{SKILL_LABELS[skill]}</p>
                <div>
                  {specs.map((s) => (
                    <SpecRow key={s.id} spec={s} selected={selectedIds.has(s.id)} onToggle={toggleSpec} />
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Action bar */}
      {hasSelection && (
        <div className="sticky bottom-0 mt-6 border-t border-border bg-background px-0 py-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              {selectedIds.size} даалгавар · хамгийн ихдээ {estimatedVariants} хувилбар · хамгийн их зардал ${maxCost}
            </span>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Үүсгэх
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
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

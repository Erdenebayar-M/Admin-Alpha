"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  getGenerateSpecs,
  generateTasks,
  type GenerateSpec,
  type GenerateTaskResult,
} from "@/lib/api";
import {
  SKILL_LABELS,
  TASK_TYPE_INFO,
  deriveInteractionForm,
  INTERACTION_FORM_LABELS,
} from "@/lib/task-defaults";
import { DifficultyDots } from "@/components/ui/difficulty-dots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GRADE_LABELS: Record<string, string> = {
  G1: "1-р анги",
  G2: "2-р анги",
  G3: "3-р анги",
  G4: "4-р анги",
};

const GRADE_CODES = ["G1", "G2", "G3", "G4"] as const;
const LEVEL_CODES = ["M0", "M1", "M2", "M3", "M4", "M5"] as const;
const SKILL_ORDER = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

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
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [maxItems, setMaxItems] = useState<1 | 2 | 3>(3);
  const [maxCost, setMaxCost] = useState<1 | 5 | 10 | 20>(5);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [lastResults, setLastResults] = useState<GenerateTaskResult[] | null>(null);

  const { data: specs = [], isLoading } = useQuery({
    queryKey: ["generate-specs"],
    queryFn: getGenerateSpecs,
  });

  const filteredSpecs = useMemo(
    () =>
      selectedGrades.length === 0
        ? []
        : specs.filter((s) => s.grade_band.some((g) => selectedGrades.includes(g))),
    [specs, selectedGrades],
  );

  const specNameById = useMemo(
    () => new Map(specs.map((s) => [s.id, s.mongolian_name])),
    [specs],
  );

  function toggleGrade(g: string) {
    setSelectedGrades((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  }

  function toggleLevel(lv: string) {
    setSelectedLevels((prev) =>
      prev.includes(lv) ? prev.filter((x) => x !== lv) : [...prev, lv],
    );
  }

  function toggleSpec(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds((prev) => new Set([...prev, ...filteredSpecs.map((s) => s.id)]));
  }

  const mutation = useMutation({
    mutationFn: () =>
      generateTasks(
        [...selectedIds],
        selectedGrades.map((g) => Number(g.slice(1))),
        selectedLevels,
        maxItems,
        maxCost,
      ),
    onSuccess: (data) => {
      setSelectedIds(new Set());
      setLastResults(data.results);
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
      const total = data.results.reduce((s, r) => s + r.drafts_created, 0);
      const missed = data.results.reduce((s, r) => s + r.rejected, 0) + data.results.filter((r) => r.error).length;
      setToast({
        msg: missed > 0
          ? `${total} даалгавар үүсгэгдлээ · ${missed} алгассан — доор дэлгэрэнгүй`
          : `${total} даалгавар амжилттай үүсгэгдлээ`,
        ok: true,
      });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err: Error) => {
      setToast({ msg: err.message ?? "Үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.", ok: false });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const hasSelection = selectedIds.size > 0 && selectedGrades.length > 0;
  // One generation cell per (grade × task type); selected levels are a filter
  // within each cell, not a multiplier — see backend content.ts /generate.
  const estimatedVariants = selectedIds.size * maxItems * selectedGrades.length;

  if (mutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <svg className="h-10 w-10 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="mt-5 text-base font-medium text-foreground">Даалгавар үүсгэж байна…</p>
        <p className="mt-1.5 text-sm text-muted-foreground">Нэг минут орчим болно</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Grade band card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ангийн бүлэг <span className="text-destructive">*</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {GRADE_CODES.map((g) => {
                  const active = selectedGrades.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGrade(g)}
                      className={cn(
                        "rounded-lg border px-5 py-3 text-sm font-semibold transition-all",
                        active
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

          {/* Spec list — shown after grade selection */}
          {selectedGrades.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Даалгаврын төрөл</CardTitle>
                  {filteredSpecs.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllVisible}
                        className="text-xs text-primary hover:underline"
                      >
                        Бүгдийг сонгох
                      </button>
                      {hasSelection && (
                        <button
                          type="button"
                          onClick={() => setSelectedIds(new Set())}
                          className="text-xs text-muted-foreground hover:text-destructive hover:underline"
                        >
                          Цэвэрлэх
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-9 animate-pulse rounded border border-border bg-muted" />
                    ))}
                  </div>
                ) : filteredSpecs.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
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
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Тохиргоо</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-bold text-muted-foreground">
                  Түвшин <span className="font-normal text-xs text-muted-foreground/70">(сонгохгүй бол бүх түвшин)</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {LEVEL_CODES.map((lv) => (
                    <ToggleChip key={lv} value={lv} active={selectedLevels.includes(lv)} onClick={toggleLevel}>
                      {lv}
                    </ToggleChip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-muted-foreground">Даалгавар бүрт хувилбарын тоо</p>
                <div className="flex gap-1">
                  {([1, 2, 3] as const).map((n) => (
                    <ToggleChip key={n} value={n} active={maxItems === n} onClick={setMaxItems}>
                      {n}
                    </ToggleChip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-muted-foreground">Хамгийн их зардлын хязгаар</p>
                <div className="flex gap-1">
                  {([1, 5, 10, 20] as const).map((n) => (
                    <ToggleChip key={n} value={n} active={maxCost === n} onClick={setMaxCost}>
                      ${n}
                    </ToggleChip>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {hasSelection && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-semibold text-foreground">{selectedIds.size}</span> даалгавар сонгогдсон
                  · хамгийн ихдээ <span className="font-semibold text-foreground">{estimatedVariants}</span> хувилбар
                </p>
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Үүсгэх
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {lastResults && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Үр дүн (нүд тус бүрээр)</CardTitle>
              <button
                type="button"
                onClick={() => router.push("/admin/review")}
                className="text-xs text-primary hover:underline"
              >
                Review queue-рүү очих
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                    <th className="py-1.5 pr-3">Даалгаврын төрөл</th>
                    <th className="py-1.5 pr-3">Анги</th>
                    <th className="py-1.5 pr-3 text-right">Үүссэн</th>
                    <th className="py-1.5 pr-3 text-right">Алгассан</th>
                    <th className="py-1.5 pr-3 text-right">AI хориглосон</th>
                    <th className="py-1.5">Тайлбар</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lastResults.map((r, i) => {
                    const missed = r.rejected > 0 || !!r.error || r.drafts_created === 0;
                    return (
                      <tr key={`${r.task_type}-${r.grade}-${i}`} className={missed ? "text-amber-700 dark:text-amber-400" : ""}>
                        <td className="py-1.5 pr-3">{specNameById.get(r.task_type) ?? r.task_type}</td>
                        <td className="py-1.5 pr-3">G{r.grade}</td>
                        <td className="py-1.5 pr-3 text-right font-medium text-foreground">{r.drafts_created}</td>
                        <td className="py-1.5 pr-3 text-right">{r.rejected}</td>
                        <td className="py-1.5 pr-3 text-right">{r.ai_blocked}</td>
                        <td className="py-1.5 text-xs">{r.error ?? (missed ? "Зарим хувилбар алгассан эсвэл шалгуур дээр унасан" : "")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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

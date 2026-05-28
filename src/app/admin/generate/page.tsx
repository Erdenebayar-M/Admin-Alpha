"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  getGenerateSpecs,
  generateTasks,
  type GenerateSpec,
  type GenerateTaskResult,
} from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type GradeBand = "G12" | "G24" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SKILL_NAMES: Record<string, string> = {
  S1: "Үсэг-авиа ялгалт",
  S2: "Үгийн зөв бичлэг",
  S3: "Урт/богино эгшиг",
  S4: "Балархай эгшиг",
  S5: "Залгавар/нөхцөл",
  S6: "Өгүүлбэрийн тэмдэглэгээ",
  S7: "Сонсголоор буулгах",
  S8: "Алдаа засах",
};

function specGrade(spec: GenerateSpec): "G12" | "G24" {
  return spec.id.startsWith("G12") ? "G12" : "G24";
}

function difficultyStars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SpecCard({
  spec,
  selected,
  onToggle,
}: {
  spec: GenerateSpec;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
        selected
          ? "border-foreground bg-foreground/5"
          : "border-border hover:border-foreground/40",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(spec.id)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-foreground"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium leading-snug">{spec.mongolian_name}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {SKILL_NAMES[spec.primary_skill] ?? spec.primary_skill} · {difficultyStars(spec.difficulty)}
        </p>
      </div>
    </label>
  );
}

function ResultRow({ r }: { r: GenerateTaskResult }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="font-mono text-xs font-medium">{r.task_id}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-green-600">✓ {r.drafts_created} to review</span>
        {r.ai_blocked > 0 && (
          <span className="text-xs text-yellow-600">⚠ {r.ai_blocked} AI blocked</span>
        )}
        {r.rejected > 0 && (
          <span className="text-xs text-red-500">✕ {r.rejected} invalid</span>
        )}
        <span className="w-16 text-right text-xs text-muted-foreground">
          ${r.cost_usd.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [maxItems, setMaxItems] = useState<1 | 2 | 3>(3);
  const [maxCost, setMaxCost] = useState<1 | 5 | 10 | 20>(5);
  const [results, setResults] = useState<{
    rows: GenerateTaskResult[];
    total_cost_usd: number;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showToast = useCallback((message: string, duration = 3000) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, []);

  const { data: specs = [], isLoading } = useQuery({
    queryKey: ["generate-specs"],
    queryFn: getGenerateSpecs,
  });

  const g12Specs = useMemo(() => specs.filter((s) => specGrade(s) === "G12"), [specs]);
  const g24Specs = useMemo(() => specs.filter((s) => specGrade(s) === "G24"), [specs]);

  // ─── Selection helpers ──────────────────────────────────────────────────────

  function toggleSpec(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectGroup(band: GradeBand) {
    const ids =
      band === "all"
        ? specs.map((s) => s.id)
        : specs.filter((s) => specGrade(s) === band).map((s) => s.id);
    setSelectedIds((prev) => new Set([...prev, ...ids]));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // ─── Generation mutation ────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: () =>
      generateTasks([...selectedIds], maxItems, maxCost),
    onSuccess: (data) => {
      setResults({ rows: data.results, total_cost_usd: data.total_cost_usd });
      setSelectedIds(new Set());
    },
    onError: (err) => {
      showToast((err as Error).message ?? "Generation failed. Please try again.");
    },
  });

  const hasSelection = selectedIds.size > 0;
  const estimatedVariants = selectedIds.size * maxItems;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "mx-auto max-w-4xl px-4 py-8",
        (hasSelection || results) && "pb-28",
      )}
    >
      <h1 className="mb-6 text-xl font-semibold">Generate Tasks</h1>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Variants per task</p>
          <div className="flex gap-1">
            {([1, 2, 3] as const).map((n) => (
              <ToggleChip key={n} value={n} active={maxItems === n} onClick={setMaxItems}>
                {n}
              </ToggleChip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Max cost cap</p>
          <div className="flex gap-1">
            {([1, 5, 10, 20] as const).map((n) => (
              <ToggleChip key={n} value={n} active={maxCost === n} onClick={setMaxCost}>
                ${n}
              </ToggleChip>
            ))}
          </div>
        </div>
      </div>

      {/* Select shortcuts */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selectGroup("G12")}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
        >
          1–2-р анги бүгд
        </button>
        <button
          type="button"
          onClick={() => selectGroup("G24")}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
        >
          2–4-р анги бүгд
        </button>
        <button
          type="button"
          onClick={() => selectGroup("all")}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
        >
          Бүгдийг сонгох
        </button>
        {hasSelection && (
          <button
            type="button"
            onClick={clearSelection}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-red-400 hover:text-red-500"
          >
            Цэвэрлэх
          </button>
        )}
      </div>

      {/* Task grids */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {g12Specs.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                1–2-р анги ({g12Specs.length})
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {g12Specs.map((s) => (
                  <SpecCard
                    key={s.id}
                    spec={s}
                    selected={selectedIds.has(s.id)}
                    onToggle={toggleSpec}
                  />
                ))}
              </div>
            </div>
          )}
          {g24Specs.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                2–4-р анги ({g24Specs.length})
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {g24Specs.map((s) => (
                  <SpecCard
                    key={s.id}
                    spec={s}
                    selected={selectedIds.has(s.id)}
                    onToggle={toggleSpec}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results panel */}
      {results && (
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Generation complete</h2>
          <div className="divide-y divide-border">
            {results.rows.map((r) => (
              <ResultRow key={r.task_id} r={r} />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Total cost:{" "}
              <span className="font-medium text-foreground">
                ${results.total_cost_usd.toFixed(4)}
              </span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResults(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Generate again
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/review")}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity"
              >
                View in Review Queue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky confirmation / action bar ───────────────────────────────── */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform duration-200",
          hasSelection && !mutation.isPending ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!hasSelection || mutation.isPending}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedIds.size} task{selectedIds.size === 1 ? "" : "s"} selected
              {" · "}up to {estimatedVariants} variant{estimatedVariants === 1 ? "" : "s"}
              {" · "}max cost ${maxCost}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              Clear
            </button>
          </div>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:pointer-events-none disabled:opacity-60"
          >
            Generate
          </button>
        </div>
      </div>

      {/* Generating overlay (replaces bar while running) */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform duration-200",
          mutation.isPending ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!mutation.isPending}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <svg
            className="h-4 w-4 animate-spin text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
            />
          </svg>
          <span className="text-sm font-medium text-muted-foreground">
            Generating tasks… this may take a minute
          </span>
        </div>
      </div>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg transition-all duration-300",
          (hasSelection || mutation.isPending) && "bottom-[72px]",
          toast.visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        {toast.message}
      </div>
    </div>
  );
}

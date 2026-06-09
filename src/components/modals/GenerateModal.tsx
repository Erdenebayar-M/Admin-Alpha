"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/lib/modal-store";
import {
  getGenerateSpecs,
  generateTasks,
  type GenerateSpec,
  type GenerateTaskResult,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogBody,
} from "@/components/ui/dialog";

type GradeFilter = "G1" | "G2" | "G3" | "G4" | "all";

const GRADE_LABELS: Record<string, string> = {
  G1: "1-р анги",
  G2: "2-р анги",
  G3: "3-р анги",
  G4: "4-р анги",
};

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

function gradeLabel(grades: string[]): string {
  return grades.map((g) => GRADE_LABELS[g] ?? g).join(", ");
}

function difficultyStars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
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
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
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
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {gradeLabel(spec.grade_band)}
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
        <span className="text-xs text-green-600">✓ {r.drafts_created} хянах</span>
        {r.ai_blocked > 0 && (
          <span className="text-xs text-yellow-600">⚠ {r.ai_blocked} AI хаасан</span>
        )}
        {r.rejected > 0 && (
          <span className="text-xs text-red-500">✕ {r.rejected} буруу</span>
        )}
        <span className="w-16 text-right text-xs text-muted-foreground">
          ${r.cost_usd.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

function GenerateModalContent({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [maxItems, setMaxItems] = useState<1 | 2 | 3>(3);
  const [maxCost, setMaxCost] = useState<1 | 5 | 10 | 20>(5);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [results, setResults] = useState<{
    rows: GenerateTaskResult[];
    total_cost_usd: number;
  } | null>(null);

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
      setResults({ rows: data.results, total_cost_usd: data.total_cost_usd });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["content-stats"] });
    },
  });

  const hasSelection = selectedIds.size > 0;
  const estimatedVariants = selectedIds.size * maxItems;

  return (
    <>
      <DialogHeader>
        <DialogTitle>AI-аар даалгавар үүсгэх</DialogTitle>
        <DialogClose className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </DialogClose>
      </DialogHeader>

      <DialogBody className="p-6">
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredSpecs.map((s) => (
              <SpecCard key={s.id} spec={s} selected={selectedIds.has(s.id)} onToggle={toggleSpec} />
            ))}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Үүсгэлт дуусгавар болов</h2>
            <div className="divide-y divide-border">
              {results.rows.map((r) => (
                <ResultRow key={r.task_id} r={r} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                Нийт зардал:{" "}
                <span className="font-medium text-foreground">${results.total_cost_usd.toFixed(4)}</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResults(null)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Дахин үүсгэх
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Хяналтад харах →
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogBody>

      {/* Action bar */}
      {(hasSelection || mutation.isPending) && (
        <div className="shrink-0 border-t border-border bg-background px-6 py-3">
          {mutation.isPending ? (
            <div className="flex items-center gap-3">
              <svg className="h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              <span className="text-sm text-muted-foreground">
                Даалгавар үүсгэж байна… нэг минут орчим болж болно
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">
                {selectedIds.size} даалгавар · хамгийн ихдээ {estimatedVariants} хувилбар · хамгийн их зардал ${maxCost}
              </span>
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:pointer-events-none disabled:opacity-60 shadow-sm"
              >
                Үүсгэх
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function GenerateModal() {
  const { openGenerate, setOpenGenerate } = useModalStore();

  return (
    <Dialog open={openGenerate} onOpenChange={setOpenGenerate}>
      <DialogContent size="fullscreen">
        {openGenerate && <GenerateModalContent onClose={() => setOpenGenerate(false)} />}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getLiveTasks, type LiveTaskFilters } from "@/lib/api";
import { useModalStore } from "@/lib/modal-store";
import { cn } from "@/lib/utils";
import { TASK_TYPE_INFO } from "@/lib/task-defaults";
import type { LiveTask } from "@/lib/types";

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

function difficultyStars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function DescriptionCell({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="group relative">
      <span className="line-clamp-1 cursor-default text-xs text-muted-foreground">{text}</span>
      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-72 rounded-md border border-border bg-popover p-3 text-xs leading-relaxed text-foreground shadow-lg group-hover:block">
        {text}
      </div>
    </div>
  );
}

type GradeFilter = "all" | "G12" | "G24";

export function TasksTab() {
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();
  const { pageToast, clearPageToast } = useModalStore();

  useEffect(() => {
    if (!pageToast) return;
    setToastVisible(true);
    const hide = setTimeout(() => setToastVisible(false), 2800);
    const clear = setTimeout(() => clearPageToast(), 3200);
    return () => { clearTimeout(hide); clearTimeout(clear); };
  }, [pageToast, clearPageToast]);

  const filters: LiveTaskFilters = grade !== "all" ? { grade } : {};

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["live-tasks", filters],
    queryFn: () => getLiveTasks(filters),
    staleTime: 30_000,
  });

  const availableTypes = Array.from(new Set(tasks.map((t) => t.task_type))).sort();
  const filtered = (typeFilter === "all" ? tasks : tasks.filter((t) => t.task_type === typeFilter))
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="relative px-4 py-6">
      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(["all", "G12", "G24"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { setGrade(g); setTypeFilter("all"); }}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                grade === g
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              )}
            >
              {g === "all" ? "Бүгд" : g === "G12" ? "1–2-р анги" : "2–4-р анги"}
            </button>
          ))}
        </div>

        {availableTypes.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
          >
            <option value="all">Бүх төрөл</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_INFO[t]?.label ?? t}
              </option>
            ))}
          </select>
        )}

        <span className="ml-auto shrink-0 text-sm text-muted-foreground">
          {isLoading ? "—" : `${filtered.length} даалгавар`}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Батлагдсан даалгавар олдсонгүй.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">ID</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Төрөл</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Анги</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Гарчиг</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Чадвар</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Хүндрэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((task: LiveTask) => (
                <tr
                  key={task.task_id}
                  onClick={() => router.push(`/admin/tasks/${task.task_id}`)}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {task.task_id.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-sm leading-tight">
                      {TASK_TYPE_INFO[task.task_type]?.label ?? task.task_type}
                    </div>
                    <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {task.task_type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {task.grade_band.map((g) => (
                        <span
                          key={g}
                          className="rounded border border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[200px] px-3 py-2.5">
                    <span className="line-clamp-1 font-medium">{task.title || task.prompt_text}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs font-medium text-foreground">
                      {SKILL_NAMES[task.primary_skill] ?? task.primary_skill}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{task.primary_skill}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-yellow-500">
                    {difficultyStars(task.difficulty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Page-level toast */}
      {pageToast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300",
            toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
            pageToast.type === "success"
              ? "bg-foreground text-background"
              : "bg-[#DC2B33] text-white",
          )}
        >
          {pageToast.message}
        </div>
      )}
    </div>
  );
}

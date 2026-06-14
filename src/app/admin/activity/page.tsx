"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Users, GraduationCap, PencilLine, BookOpen, Activity, RefreshCw,
  ChevronRight, ChevronUp, ChevronDown, Search, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Lozenge } from "@/components/ui/lozenge";
import { useActivityStats } from "@/hooks/useActivityStats";
import { getAdminLearners } from "@/lib/api";
import type { Tone } from "@/lib/status";
import type { AdminLearner } from "@/lib/types";

const PER_PAGE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VARIANT_LABEL: Record<string, string> = { A: "Хувилбар A (1-2 анги)", B: "Хувилбар B (2-4 анги)" };
const STATUS_TONE: Record<string, Tone> = {
  COMPLETED: "success",
  IN_PROGRESS: "info",
  PENDING: "neutral",
  ABANDONED: "danger",
};

function pct(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function fmtPct(v: number | null | undefined): string {
  return v == null ? "—" : `${Math.round(v * 100)}%`;
}

function fmtNum(v: number | null | undefined, digits = 1): string {
  return v == null ? "—" : v.toFixed(digits);
}

function fmtAgo(iso: string | null): string {
  if (!iso) return "идэвх алга";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s} сек өмнө`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цаг өмнө`;
  return `${Math.floor(h / 24)} өдөр өмнө`;
}

function DistBars({
  data,
  labelMap,
  toneMap,
  emptyHint,
}: {
  data: Record<string, number>;
  labelMap?: Record<string, string>;
  toneMap?: Record<string, Tone>;
  emptyHint?: string;
}) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) {
    return <EmptyState message="Өгөгдөл алга" subMessage={emptyHint} className="py-8" />;
  }
  return (
    <div className="space-y-2.5">
      {entries.map(([key, count]) => {
        const tone = toneMap?.[key] ?? "info";
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-foreground truncate">{labelMap?.[key] ?? key}</span>
              <span className="tabular-nums text-muted-foreground shrink-0">
                {count} · {pct(count, total)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={
                  tone === "success" ? "h-full rounded-full bg-green-500"
                  : tone === "danger" ? "h-full rounded-full bg-red-500"
                  : tone === "warning" ? "h-full rounded-full bg-amber-500"
                  : tone === "neutral" ? "h-full rounded-full bg-muted-foreground/40"
                  : "h-full rounded-full bg-primary"
                }
                style={{ width: `${pct(count, total)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2 border-b border-border">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

const LEVEL_TONE: Record<string, Tone> = {
  M0: "neutral", M1: "info", M2: "success", M3: "warning", M4: "warning", M5: "success",
};

type SortKey = "general_level" | "lesson_count" | "attempt_count" | "current_streak";
type SortDir = "asc" | "desc";

const LEVEL_ORDER: Record<string, number> = { M0: 0, M1: 1, M2: 2, M3: 3, M4: 4, M5: 5 };

function LearnerRows({
  learners,
  sortKey,
  sortDir,
  onSort,
}: {
  learners: AdminLearner[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const sorted = useMemo(() => {
    return [...learners].sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === "general_level") {
        av = LEVEL_ORDER[a.general_level] ?? 0;
        bv = LEVEL_ORDER[b.general_level] ?? 0;
      } else {
        av = a[sortKey] as number;
        bv = b[sortKey] as number;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [learners, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="size-3 text-primary" />
      : <ChevronDown className="size-3 text-primary" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Нэр</th>
            <th className="px-4 py-2.5 font-medium">Анги</th>
            <th
              className="px-4 py-2.5 font-medium cursor-pointer hover:text-foreground select-none"
              onClick={() => onSort("general_level")}
            >
              <span className="inline-flex items-center gap-1">Түвшин <SortIcon col="general_level" /></span>
            </th>
            <th
              className="px-4 py-2.5 font-medium tabular-nums cursor-pointer hover:text-foreground select-none"
              onClick={() => onSort("current_streak")}
            >
              <span className="inline-flex items-center gap-1">Дараалал <SortIcon col="current_streak" /></span>
            </th>
            <th
              className="px-4 py-2.5 font-medium tabular-nums cursor-pointer hover:text-foreground select-none"
              onClick={() => onSort("lesson_count")}
            >
              <span className="inline-flex items-center gap-1">Хичээл <SortIcon col="lesson_count" /></span>
            </th>
            <th
              className="px-4 py-2.5 font-medium tabular-nums cursor-pointer hover:text-foreground select-none"
              onClick={() => onSort("attempt_count")}
            >
              <span className="inline-flex items-center gap-1">Оролдлого <SortIcon col="attempt_count" /></span>
            </th>
            <th className="px-4 py-2.5 font-medium">Эцэг/эх</th>
            <th className="px-4 py-2.5 font-medium">Анхаарах</th>
            <th className="px-4 py-2.5 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((l) => (
            <tr key={l.id} className="hover:bg-accent/40 transition-colors group">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/activity/${l.id}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {l.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{l.grade}-р анги</td>
              <td className="px-4 py-3">
                <Lozenge tone={LEVEL_TONE[l.general_level] ?? "neutral"}>{l.general_level}</Lozenge>
              </td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{l.current_streak}🔥</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{l.lesson_count}</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{l.attempt_count}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[160px]">{l.parent_email}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {l.weak_skills.slice(0, 3).map((s) => (
                    <Lozenge key={s} tone="danger">{s}</Lozenge>
                  ))}
                  {l.weak_skills.length === 0 && l.top_error_codes.slice(0, 2).map((e) => (
                    <Lozenge key={e} tone="warning">{e}</Lozenge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/activity/${l.id}`}>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [tab, setTab] = useState<"learners" | "stats">("learners");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lesson_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: statsData, isLoading: statsLoading, isFetching, refetch, dataUpdatedAt } = useActivityStats();

  const {
    data: learnersData,
    isLoading: learnersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["admin-learners", debouncedSearch],
    queryFn: ({ pageParam = 1 }) => getAdminLearners(pageParam as number, debouncedSearch, PER_PAGE),
    getNextPageParam: (last) => last.meta.has_next ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 15_000,
  });

  const allLearners = useMemo(
    () => learnersData?.pages.flatMap((p) => p.learners) ?? [],
    [learnersData],
  );
  const total = learnersData?.pages[0]?.meta.total ?? 0;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const t = statsData?.totals;

  return (
    <div>
      <PageHeader
        title="Хэрэглэгчийн идэвх"
        subtitle="Суралцагчдын оношилгоо, төлөвлөгөө, хичээлийн бодит өгөгдөл"
        actions={
          <div className="flex items-center gap-3">
            {dataUpdatedAt > 0 && (
              <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums">
                Шинэчлэгдсэн: {new Date(dataUpdatedAt).toLocaleTimeString("mn-MN")}
              </span>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Шинэчлэх
            </button>
          </div>
        }
      />

      <div className="px-4 py-6 sm:px-6 space-y-6">
        {/* Live activity banner */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-border bg-card px-5 py-3 text-sm">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Activity className="size-4 text-primary" />
            Сүүлийн 1 цагт: <span className="tabular-nums">{statsData?.activity.attempts_last_hour ?? "—"}</span> оролдлого
          </span>
          <span className="text-muted-foreground">
            Хамгийн сүүлд: {statsData ? fmtAgo(statsData.activity.last_attempt_at) : "—"}
          </span>
          <span className="text-muted-foreground">
            Урт цуваа (streak): <span className="tabular-nums">{statsData?.longest_streak ?? "—"}</span>
          </span>
        </div>

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Эцэг эх (бүртгэл)" value={t?.parents} loading={statsLoading} icon={<Users className="size-5" />} tone="info" />
          <StatCard label="Суралцагч" value={t?.learners} loading={statsLoading} icon={<GraduationCap className="size-5" />} tone="success" />
          <StatCard label="Нийт оролдлого" value={t?.attempts} loading={statsLoading} icon={<PencilLine className="size-5" />} tone="warning" />
          <StatCard label="Хичээл" value={t?.lessons} loading={statsLoading} icon={<BookOpen className="size-5" />} tone="neutral" />
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
          <button
            type="button"
            onClick={() => setTab("learners")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === "learners"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Суралцагчид {learnersLoading ? "" : `(${total})`}
          </button>
          <button
            type="button"
            onClick={() => setTab("stats")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === "stats"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Статистик
          </button>
        </div>

        {/* Суралцагчид tab */}
        {tab === "learners" && (
          <Card>
            {/* Search bar */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Нэр эсвэл и-мэйл хайх…"
                  className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              {!learnersLoading && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {allLearners.length} / {total} харуулж байна
                </span>
              )}
            </div>

            <CardContent className="p-0">
              {learnersLoading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-10 animate-pulse rounded bg-muted" />
                      <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : allLearners.length === 0 ? (
                <EmptyState message="Суралцагч олдсонгүй" className="py-10" />
              ) : (
                <LearnerRows
                  learners={allLearners}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              )}

              {/* Load more */}
              {hasNextPage && (
                <div className="border-t border-border px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {allLearners.length} / {total} ачаалагдсан
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {isFetchingNextPage
                      ? <><Loader2 className="size-3.5 animate-spin" /> Ачаалж байна…</>
                      : <>Дараагийн {PER_PAGE}</>
                    }
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Статистик tab */}
        {tab === "stats" && (
          <>
            {/* Secondary totals */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Оношилгоо" value={t?.diagnostic_sessions} loading={statsLoading} icon={<Activity className="size-5" />} tone="info"
                subLine={statsData ? `${statsData.diagnostic_by_status.COMPLETED ?? 0} дууссан` : undefined} />
              <StatCard label="Төлөвлөгөө" value={t?.plans} loading={statsLoading} icon={<BookOpen className="size-5" />} tone="success" />
              <StatCard label="Алдааны бүртгэл" value={t?.error_logs} loading={statsLoading} icon={<PencilLine className="size-5" />} tone="danger" />
              <StatCard label="Шалгалтын цэг" value={t?.checkpoints} loading={statsLoading} icon={<Activity className="size-5" />} tone="neutral" />
            </div>

            {/* Averages */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Хичээлийн дундаж нарийвчлал" value={fmtPct(statsData?.averages.lesson_accuracy)} loading={statsLoading} icon={<BookOpen className="size-5" />} tone="success" />
              <StatCard label="Оролдлогын дундаж оноо" value={statsData ? fmtNum(statsData.averages.attempt_score, 2) : undefined} loading={statsLoading} icon={<PencilLine className="size-5" />} tone="info" />
              <StatCard label="Дундаж хариулах хугацаа" value={statsData ? `${fmtNum(statsData.averages.attempt_time_seconds, 0)} сек` : undefined} loading={statsLoading} icon={<Activity className="size-5" />} tone="warning" />
            </div>

            {!statsLoading && statsData && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Суралцагч — хувилбараар">
                  <DistBars data={statsData.learners_by_variant} labelMap={VARIANT_LABEL} />
                </Panel>

                <Panel title="Суралцагч — ангиар">
                  <DistBars
                    data={statsData.learners_by_grade}
                    labelMap={Object.fromEntries(Object.keys(statsData.learners_by_grade).map((g) => [g, `${g}-р анги`]))}
                  />
                </Panel>

                <Panel title="Оношилгоо — төлвөөр">
                  <DistBars data={statsData.diagnostic_by_status} toneMap={STATUS_TONE} />
                </Panel>

                <Panel title="Хичээл — төлвөөр">
                  <DistBars data={statsData.lessons_by_status} toneMap={STATUS_TONE} />
                </Panel>

                <Panel title="Төлөвлөгөө — загвараар">
                  <DistBars data={statsData.plans_by_template} />
                </Panel>

                <Panel title="Ерөнхий түвшин (M0–M5)">
                  <DistBars data={statsData.level_distribution} />
                </Panel>

                <Panel title="Оноогоор">
                  <DistBars
                    data={statsData.score_distribution}
                    labelMap={Object.fromEntries(Object.keys(statsData.score_distribution).map((s) => [s, `${s} оноо`]))}
                  />
                </Panel>

                <Panel title="Хамгийн түгээмэл алдааны код">
                  {statsData.top_error_codes.length === 0 ? (
                    <EmptyState message="Алдаа бүртгэгдээгүй" className="py-8" />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {statsData.top_error_codes.map((e) => (
                        <span key={e.code} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs">
                          <Lozenge tone="danger">{e.code}</Lozenge>
                          <span className="tabular-nums font-medium text-foreground">{e.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            )}

            {statsLoading && (
              <div className="grid gap-6 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

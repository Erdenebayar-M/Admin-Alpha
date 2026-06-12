"use client";

import { Users, GraduationCap, PencilLine, BookOpen, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Lozenge } from "@/components/ui/lozenge";
import { useActivityStats } from "@/hooks/useActivityStats";
import type { Tone } from "@/lib/status";

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

/** Horizontal bar list for a { key: count } distribution. */
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useActivityStats();
  const t = data?.totals;

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
            Сүүлийн 1 цагт: <span className="tabular-nums">{data?.activity.attempts_last_hour ?? "—"}</span> оролдлого
          </span>
          <span className="text-muted-foreground">
            Хамгийн сүүлд: {data ? fmtAgo(data.activity.last_attempt_at) : "—"}
          </span>
          <span className="text-muted-foreground">
            Урт цуваа (streak): <span className="tabular-nums">{data?.longest_streak ?? "—"}</span>
          </span>
        </div>

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Эцэг эх (бүртгэл)" value={t?.parents} loading={isLoading} icon={<Users className="size-5" />} tone="info" />
          <StatCard label="Суралцагч" value={t?.learners} loading={isLoading} icon={<GraduationCap className="size-5" />} tone="success" />
          <StatCard label="Нийт оролдлого" value={t?.attempts} loading={isLoading} icon={<PencilLine className="size-5" />} tone="warning" />
          <StatCard label="Хичээл" value={t?.lessons} loading={isLoading} icon={<BookOpen className="size-5" />} tone="neutral" />
        </div>

        {/* Secondary totals */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Оношилгоо" value={t?.diagnostic_sessions} loading={isLoading} icon={<Activity className="size-5" />} tone="info"
            subLine={data ? `${data.diagnostic_by_status.COMPLETED ?? 0} дууссан` : undefined} />
          <StatCard label="Төлөвлөгөө" value={t?.plans} loading={isLoading} icon={<BookOpen className="size-5" />} tone="success" />
          <StatCard label="Алдааны бүртгэл" value={t?.error_logs} loading={isLoading} icon={<PencilLine className="size-5" />} tone="danger" />
          <StatCard label="Шалгалтын цэг" value={t?.checkpoints} loading={isLoading} icon={<Activity className="size-5" />} tone="neutral" />
        </div>

        {/* Averages */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Хичээлийн дундаж нарийвчлал" value={fmtPct(data?.averages.lesson_accuracy)} loading={isLoading} icon={<BookOpen className="size-5" />} tone="success" />
          <StatCard label="Оролдлогын дундаж оноо" value={data ? fmtNum(data.averages.attempt_score, 2) : undefined} loading={isLoading} icon={<PencilLine className="size-5" />} tone="info" />
          <StatCard label="Дундаж хариулах хугацаа" value={data ? `${fmtNum(data.averages.attempt_time_seconds, 0)} сек` : undefined} loading={isLoading} icon={<Activity className="size-5" />} tone="warning" />
        </div>

        {/* Distributions */}
        {!isLoading && data && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Суралцагч — хувилбараар">
              <DistBars data={data.learners_by_variant} labelMap={VARIANT_LABEL} />
            </Panel>

            <Panel title="Суралцагч — ангиар">
              <DistBars
                data={data.learners_by_grade}
                labelMap={Object.fromEntries(Object.keys(data.learners_by_grade).map((g) => [g, `${g}-р анги`]))}
              />
            </Panel>

            <Panel title="Оношилгоо — төлвөөр">
              <DistBars data={data.diagnostic_by_status} toneMap={STATUS_TONE} />
            </Panel>

            <Panel title="Хичээл — төлвөөр">
              <DistBars data={data.lessons_by_status} toneMap={STATUS_TONE} />
            </Panel>

            <Panel title="Төлөвлөгөө — загвараар">
              <DistBars data={data.plans_by_template} />
            </Panel>

            <Panel title="Ерөнхий түвшин (M0–M5)">
              <DistBars data={data.level_distribution} />
            </Panel>

            <Panel title="Оноогоор">
              <DistBars
                data={data.score_distribution}
                labelMap={Object.fromEntries(Object.keys(data.score_distribution).map((s) => [s, `${s} оноо`]))}
              />
            </Panel>

            <Panel title="Хамгийн түгээмэл алдааны код">
              {data.top_error_codes.length === 0 ? (
                <EmptyState message="Алдаа бүртгэгдээгүй" className="py-8" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.top_error_codes.map((e) => (
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

        {isLoading && (
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

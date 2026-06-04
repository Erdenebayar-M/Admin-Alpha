"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, AlertTriangle, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Lozenge } from "@/components/ui/lozenge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConnectedStatusBar } from "@/components/admin/ConnectedStatusBar";
import { useContentStats } from "@/hooks/useContentStats";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { getLiveTasks } from "@/lib/api";
import { REVIEW_STATUS_META } from "@/lib/status";
import type { ReviewItem } from "@/lib/types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ActivitySkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useContentStats();
  const { data: reviewItems = [], isLoading: queueLoading } = useReviewQueue();
  const { data: liveTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["live-tasks", {}],
    queryFn: () => getLiveTasks({}),
    staleTime: 30_000,
  });

  const pendingCount = reviewItems.filter(
    (i) => i.status === "pending" || i.status === "ai_passed" || i.status === "ai_flagged",
  ).length;

  const flaggedCount = reviewItems.filter((i) => i.status === "ai_flagged").length;

  const recentItems = [...reviewItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8) as ReviewItem[];

  return (
    <div>
      <PageHeader
        title="Хяналтын самбар"
        subtitle="Агуулгын дамжуулах хоолой болон үйл ажиллагааны тойм"
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Нийт батлагдсан даалгавар"
            value={liveTasks.length}
            loading={tasksLoading}
            icon={<BookOpen className="size-5" />}
            tone="info"
          />
          <StatCard
            label="Хянах шаардлагатай"
            value={pendingCount}
            loading={queueLoading}
            icon={<Clock className="size-5" />}
            tone="warning"
          />
          <StatCard
            label="AI тэмдэглэсэн"
            value={flaggedCount}
            loading={queueLoading}
            icon={<AlertTriangle className="size-5" />}
            tone="danger"
          />
          <StatCard
            label="Өнөөдөр батлагдсан"
            value={stats?.pipeline.approved_today}
            loading={statsLoading}
            icon={<CheckCircle className="size-5" />}
            tone="success"
          />
        </div>

        {/* Pipeline */}
        <Card>
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-semibold">Дамжуулах хоолой</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ConnectedStatusBar />
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-semibold">Сүүлийн үйл ажиллагаа</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {queueLoading ? (
              <ActivitySkeleton />
            ) : recentItems.length === 0 ? (
              <EmptyState
                message="Одоогоор үйл ажиллагаа байхгүй"
                subMessage="Даалгавар үүсгэж эхэлнэ үү"
              />
            ) : (
              <div className="divide-y divide-border">
                {recentItems.map((item) => {
                  const meta = REVIEW_STATUS_META[item.status];
                  return (
                    <Link
                      key={item.id}
                      href={`/admin/review/${item.id}`}
                      className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/40"
                    >
                      <Lozenge tone={meta.tone} className="shrink-0">{meta.label}</Lozenge>
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {item.task.title || item.task.prompt_text || item.task.task_id}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {fmtDate(item.created_at)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

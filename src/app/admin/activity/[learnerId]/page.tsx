"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lozenge } from "@/components/ui/lozenge";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminLearner } from "@/lib/api";
import type { AdminLearnerSkillState, AdminActivePlan } from "@/lib/types";

// ─── Label maps ───────────────────────────────────────────────────────────────

const SKILLS = [
  { key: "s1", label: "Үсэг-авиа ялгалт" },
  { key: "s2", label: "Үгийн зөв бичлэг" },
  { key: "s3", label: "Урт/богино эгшиг" },
  { key: "s4", label: "Балархай эгшиг" },
  { key: "s5", label: "Залгавар/нөхцөл" },
  { key: "s6", label: "Өгүүлбэрийн тэмдэглэгээ" },
  { key: "s7", label: "Сонсголоор буулгах" },
  { key: "s8", label: "Алдаа засах" },
] as const;

const LEVEL_COLOR: Record<string, string> = {
  M0: "bg-muted-foreground/30",
  M1: "bg-blue-500",
  M2: "bg-emerald-500",
  M3: "bg-amber-500",
  M4: "bg-orange-500",
  M5: "bg-violet-500",
};

const LEVEL_TONE_MAP: Record<string, string> = {
  M0: "neutral", M1: "info", M2: "success", M3: "warning", M4: "warning", M5: "success",
};

const CONFIDENCE_CLASS: Record<string, string> = {
  LOW:    "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  HIGH:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};
const CONFIDENCE_LABEL: Record<string, string> = { LOW: "Бага", MEDIUM: "Дунд", HIGH: "Их" };

const PLAN_TEMPLATE_LABEL: Record<string, string> = {
  BALANCED: "Тэнцвэртэй", INTENSIVE: "Эрчимтэй", STABILIZATION: "Тогтворжуулах",
};
const PLAN_SOURCE_LABEL: Record<string, string> = {
  AI: "AI", HUMAN: "Гар аргаар",
};
const DIAG_STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "Үргэлжилж байна", COMPLETED: "Дууссан",
};
const PHASE_LABEL: Record<string, string> = {
  PHASE_A: "А үе шат", PHASE_B: "Б үе шат", PHASE_C: "В үе шат",
};
const LESSON_STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Дууссан", IN_PROGRESS: "Үргэлжилж байна", PENDING: "Хүлээгдэж байна",
};
const LESSON_STATUS_TONE: Record<string, string> = {
  COMPLETED: "success", IN_PROGRESS: "info", PENDING: "neutral",
};
const CHECKPOINT_DECISION_LABEL: Record<string, string> = {
  CONTINUE_PLAN: "Үргэлжлүүлэх", NEW_PLAN: "Шинэ төлөвлөгөө", LEVEL_UP: "Түвшин ахих",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
}
function scoreTextColor(pct: number) {
  if (pct >= 70) return "text-emerald-600";
  if (pct >= 40) return "text-amber-600";
  return "text-red-600";
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" });
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

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function SkillsPanel({ s }: { s: AdminLearnerSkillState }) {
  return (
    <Panel title="Чадварын хэмжилт (S1–S8)">
      <div className="space-y-3">
        {SKILLS.map(({ key, label }) => {
          const score = (s[`${key}_score` as keyof AdminLearnerSkillState] as number) ?? 0;
          const conf  = (s[`${key}_confidence` as keyof AdminLearnerSkillState] as string) ?? "";
          const pct   = Math.round(score * 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-foreground shrink-0">{key.toUpperCase()}</span>
                  <span className="text-xs text-muted-foreground truncate">{label}</span>
                  {conf && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${CONFIDENCE_CLASS[conf] ?? ""}`}>
                      {CONFIDENCE_LABEL[conf] ?? conf}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-bold tabular-nums shrink-0 ${scoreTextColor(pct)}`}>{pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${scoreColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function PlanPanel({ plan }: { plan: AdminActivePlan }) {
  const counts = plan.lesson_counts ?? { total: 0, completed: 0, in_progress: 0, pending: 0 };
  const completedPct = counts.total > 0
    ? Math.round((counts.completed / counts.total) * 100)
    : 0;

  return (
    <Panel title="Идэвхтэй төлөвлөгөө">
      {/* Meta row */}
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Загвар</p>
          <p className="text-sm font-semibold">{PLAN_TEMPLATE_LABEL[plan.template] ?? plan.template}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Явц</p>
          <p className="text-sm font-semibold">Өдөр {plan.current_day} / {plan.total_days}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Хугацаа</p>
          <p className="text-sm font-semibold">{plan.daily_minutes} мин/өдөр</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Үүсгэсэн</p>
          <p className="text-sm font-semibold">{PLAN_SOURCE_LABEL[plan.source] ?? plan.source}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{counts.completed} / {counts.total} хичээл дууссан</span>
          <span className="tabular-nums">{completedPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completedPct}%` }} />
        </div>
      </div>

      {/* Priority skills + target errors */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {plan.priority_skills.map((s) => <Lozenge key={s} tone="info">{s}</Lozenge>)}
        {plan.target_errors.map((e) => <Lozenge key={e} tone="danger">{e}</Lozenge>)}
      </div>

      {/* Schedule table */}
      {(plan.schedule?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Хичээлийн хуваарь</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Өдөр</th>
                  <th className="px-3 py-2 font-medium">Чадвар</th>
                  <th className="px-3 py-2 font-medium">Төлөв</th>
                  <th className="px-3 py-2 font-medium tabular-nums">Нарийвчлал</th>
                  <th className="px-3 py-2 font-medium">Огноо</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(plan.schedule ?? []).map((lesson) => {
                  const pct = lesson.accuracy != null ? Math.round(lesson.accuracy * 100) : null;
                  const tone = (LESSON_STATUS_TONE[lesson.status] ?? "neutral") as "success" | "info" | "neutral" | "warning" | "danger";
                  return (
                    <tr key={lesson.id} className="hover:bg-accent/30">
                      <td className="px-3 py-2 font-medium tabular-nums">{lesson.day_number}</td>
                      <td className="px-3 py-2 text-muted-foreground">{lesson.primary_skill}</td>
                      <td className="px-3 py-2">
                        <Lozenge tone={tone}>{LESSON_STATUS_LABEL[lesson.status] ?? lesson.status}</Lozenge>
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {pct != null
                          ? <span className={`font-bold ${scoreTextColor(pct)}`}>{pct}%</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtDate(lesson.completed_at ?? lesson.scheduled_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkpoints */}
      {(plan.checkpoints?.length ?? 0) > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Шалгалтын цэгүүд</p>
          <div className="space-y-2">
            {(plan.checkpoints ?? []).map((cp, i) => {
              const cpTone = (cp.status === "COMPLETED" ? "success" : cp.status === "PENDING" ? "neutral" : "info") as "success" | "neutral" | "info";
              return (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    {cp.status === "COMPLETED"
                      ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      : <Circle className="size-3.5 text-muted-foreground shrink-0" />
                    }
                    <span className="text-muted-foreground">{fmtDate(cp.scheduled_date)}</span>
                    <Lozenge tone={cpTone}>{LESSON_STATUS_LABEL[cp.status] ?? cp.status}</Lozenge>
                  </div>
                  {cp.decision && (
                    <span className="font-medium text-foreground">{CHECKPOINT_DECISION_LABEL[cp.decision] ?? cp.decision}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnerDetailPage() {
  const { learnerId } = useParams<{ learnerId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-learner", learnerId],
    queryFn: () => getAdminLearner(learnerId),
    enabled: !!learnerId,
  });

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <EmptyState message="Суралцагч олдсонгүй" subMessage={String(error)} />
      </div>
    );
  }

  const s = data?.skill_state;
  const diag = data?.diagnostic;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-20 border-b border-border bg-card px-4 py-3 sm:px-6 flex items-center gap-3">
        <Link
          href="/admin/activity"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Идэвх
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-semibold text-foreground">
          {isLoading ? "…" : data?.name}
        </span>
        {!isLoading && data && (
          <Lozenge tone={s ? (s.general_level === "M0" ? "neutral" : "success") : "neutral"} className="ml-1">
            {s?.general_level ?? "M0"}
          </Lozenge>
        )}
      </div>

      <div className="px-4 py-6 sm:px-6 space-y-6">
        {/* Identity row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Анги", value: data ? `${data.grade}-р анги` : "—" },
            { label: "Хувилбар", value: data ? `Хувилбар ${data.variant}` : "—" },
            { label: "Цуваа", value: s ? `${s.current_streak}🔥` : "—" },
            { label: "Эцэг/эх", value: data?.parent_email ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-semibold text-foreground truncate">{isLoading ? "…" : value}</p>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* Weak skills */}
            {(s?.weak_skills?.length ?? 0) > 0 && (
              <Panel title="Анхаарах чадварууд">
                <div className="flex flex-wrap gap-2">
                  {s!.weak_skills.map((code) => {
                    const skill = SKILLS.find((sk) => sk.key === code.toLowerCase());
                    return (
                      <span key={code} className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                        <Lozenge tone="danger">{code}</Lozenge>
                        {skill?.label}
                      </span>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Skills breakdown */}
            {s && <SkillsPanel s={s} />}

            {/* Diagnostic */}
            {diag && (
              <Panel title="Оношилгооны үр дүн">
                {/* In-progress banner */}
                {diag.status !== "COMPLETED" && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 mb-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
                    <span className="shrink-0 font-bold">⚠</span>
                    <span>
                      Оношилгоо гүйцэж дуусаагүй байна — сурагч одоо{" "}
                      <strong>{PHASE_LABEL[diag.current_phase] ?? diag.current_phase}</strong>-д байна.
                    </span>
                  </div>
                )}

                {/* Phase meta row */}
                <div className="grid gap-4 sm:grid-cols-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Төлөв</p>
                    <Lozenge tone={diag.status === "COMPLETED" ? "success" : "info"}>
                      {DIAG_STATUS_LABEL[diag.status] ?? diag.status}
                    </Lozenge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Нийт даалгавар</p>
                    <p className="text-sm font-semibold tabular-nums">{diag.attempt_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Эхэлсэн</p>
                    <p className="text-sm font-semibold">{fmtDate(diag.started_at)}</p>
                  </div>
                </div>

                {/* Per-phase breakdown */}
                {diag.phase_counts && (() => {
                  const { a_expected, b_expected, c_expected } = diag.phase_counts!;
                  const bExp = b_expected ?? 8;
                  const aAnswered = Math.min(diag.attempt_count, a_expected);
                  const bAnswered = Math.max(0, Math.min(diag.attempt_count - a_expected, bExp));
                  const cAnswered = Math.max(0, diag.attempt_count - a_expected - bExp);
                  return (
                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/20 p-3 mb-4 text-xs">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-1">А үе шат</p>
                        <p className="font-semibold tabular-nums">{aAnswered} / {a_expected}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground mb-1">Б үе шат</p>
                        <p className="font-semibold tabular-nums">{bAnswered} / {bExp}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground mb-1">В үе шат</p>
                        <p className="font-semibold tabular-nums">{cAnswered} / {c_expected}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Completion date */}
                {diag.completed_at && (
                  <p className="text-xs text-muted-foreground mb-4">Дууссан: {fmtDate(diag.completed_at)}</p>
                )}

                {/* Detected weak skills */}
                {diag.weak_skills_detected.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Илрүүлсэн сул тал</p>
                    <div className="flex flex-wrap gap-2">
                      {diag.weak_skills_detected.map((code) => {
                        const skill = SKILLS.find((sk) => sk.key === code.toLowerCase());
                        return (
                          <span key={code} className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                            <Lozenge tone="danger">{code}</Lozenge>
                            {skill?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Result payload */}
                {diag.result && (
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {diag.result.general_level && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Ерөнхий түвшин:</span>
                          <Lozenge tone={(LEVEL_TONE_MAP[diag.result.general_level] ?? "neutral") as "success" | "info" | "neutral" | "warning" | "danger"}>
                            {diag.result.general_level}
                          </Lozenge>
                        </div>
                      )}
                    </div>

                    {diag.result.priority_skills && diag.result.priority_skills.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Анхаарах чадвар</p>
                        <div className="flex flex-wrap gap-1.5">
                          {diag.result.priority_skills.map((s) => <Lozenge key={s} tone="warning">{s}</Lozenge>)}
                        </div>
                      </div>
                    )}

                    {diag.result.top_errors && diag.result.top_errors.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Гол алдаанууд</p>
                        <div className="flex flex-wrap gap-1.5">
                          {diag.result.top_errors.map((e) => <Lozenge key={e} tone="danger">{e}</Lozenge>)}
                        </div>
                      </div>
                    )}

                    {diag.result.skill_levels && Object.keys(diag.result.skill_levels).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Чадварын түвшин (оношилгооны дүн)</p>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                          {SKILLS.map(({ key, label }) => {
                            const lvl = diag.result!.skill_levels?.[key.toUpperCase()] ?? diag.result!.skill_levels?.[key] ?? null;
                            return (
                              <div key={key} className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-semibold text-muted-foreground">{key.toUpperCase()}</span>
                                {lvl ? (
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${LEVEL_COLOR[lvl] ?? "bg-muted-foreground/30"}`}>
                                    {lvl}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                                )}
                                <span className="text-[9px] text-muted-foreground text-center leading-tight hidden sm:block">{label.split("/")[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            )}

            {/* Active plan */}
            {data.active_plan && <PlanPanel plan={data.active_plan} />}

            {/* Recent lessons */}
            {data.recent_lessons.length > 0 && (
              <Panel title={`Сүүлийн хичээлүүд (${data.recent_lessons.length})`}>
                <div className="divide-y divide-border -mx-4 sm:-mx-4">
                  {data.recent_lessons.map((lesson) => {
                    const pct = lesson.accuracy != null ? Math.round(lesson.accuracy * 100) : null;
                    return (
                      <div key={lesson.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-medium text-foreground shrink-0">Өдөр {lesson.day_number}</span>
                          <span className="text-xs text-muted-foreground truncate">{lesson.primary_skill}</span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {pct != null && (
                            <span className={`text-xs font-bold tabular-nums ${scoreTextColor(pct)}`}>{pct}%</span>
                          )}
                          <span className="text-xs text-muted-foreground tabular-nums">{fmtDate(lesson.completed_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Top errors */}
            {(s?.top_error_codes?.length ?? 0) > 0 && (
              <Panel title="Давтагдах алдаанууд">
                <div className="flex flex-wrap gap-2">
                  {s!.top_error_codes.map((code) => <Lozenge key={code} tone="danger">{code}</Lozenge>)}
                </div>
                {(s?.recent_error_codes?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Сүүлийн 7 хоногт</p>
                    <div className="flex flex-wrap gap-2">
                      {s!.recent_error_codes.map((code) => <Lozenge key={code} tone="warning">{code}</Lozenge>)}
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {/* Settings meta */}
            {s && (
              <Panel title="Тохиргоо">
                <div className="grid gap-4 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Дуртай хугацаа</p>
                    <p className="font-semibold">{s.preferred_session_length} мин</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Хамгийн урт цуваа</p>
                    <p className="font-semibold">{s.longest_streak} өдөр</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Шинэчлэгдсэн</p>
                    <p className="font-semibold">{fmtDate(s.updated_at)}</p>
                  </div>
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    </div>
  );
}

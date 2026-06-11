import {
  ERROR_LABELS,
  LESSON_SLOT_LABELS,
  SKILL_LABELS,
  TASK_TYPE_INFO,
} from "@/lib/task-defaults";
import type { TaskContent } from "@/lib/types";
import { DifficultyDots } from "@/components/ui/difficulty-dots";

interface Props {
  task: Pick<
    TaskContent,
    | "task_type"
    | "primary_skill"
    | "level_target"
    | "grade_band"
    | "difficulty"
    | "estimated_time_seconds"
    | "lesson_slot_fit"
    | "error_targets"
  >;
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
        {label}
      </p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function ExerciseInfoCard({ task }: Props) {
  const skillLabel = SKILL_LABELS[task.primary_skill];
  const slotLabel = LESSON_SLOT_LABELS[task.lesson_slot_fit] ?? task.lesson_slot_fit;
  const typeInfo = TASK_TYPE_INFO[task.task_type];

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Дасгалын тайлбар
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* col 1 */}
        <MetaRow label="Дасгалын төрөл">
          <span className="font-medium">{typeInfo?.label ?? task.task_type}</span>
          {typeInfo?.shortLabel && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">({typeInfo.shortLabel})</span>
          )}
        </MetaRow>

        {/* col 2 */}
        <MetaRow label="Түвшин">
          <span className="font-mono">{task.level_target}</span>
        </MetaRow>

        {/* col 1 */}
        <MetaRow label="Ур чадвар">
          <span className="font-mono text-primary">{task.primary_skill}</span>
          {skillLabel && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{skillLabel}</span>
          )}
        </MetaRow>

        {/* col 2 */}
        <MetaRow label="Хүндийн түвшин">
          <DifficultyDots n={task.difficulty} />
        </MetaRow>

        {/* col 1 */}
        <MetaRow label="Анги">
          {task.grade_band.length > 0 ? task.grade_band.join(", ") : "—"}
        </MetaRow>

        {/* col 2 */}
        <MetaRow label="Хугацаа">
          {task.estimated_time_seconds ? `${task.estimated_time_seconds}с` : "—"}
        </MetaRow>

        {/* col 1 */}
        <MetaRow label="Алдааны оношилгоо">
          {task.error_targets.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {task.error_targets.map((code) => (
                <span
                  key={code}
                  className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-normal"
                >
                  {code}
                  {ERROR_LABELS[code] ? ` — ${ERROR_LABELS[code]}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </MetaRow>

        {/* col 2 */}
        <MetaRow label="Хичээлийн үе">
          {slotLabel || "—"}
        </MetaRow>
      </div>
    </div>
  );
}

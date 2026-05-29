"use client";

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { ReviewAction, ReviewItem, TaskContent } from "@/lib/types";

const FLAG_LABELS: Record<string, string> = {
  A: "Зөв бичих дүрмийн алдаа",
  B: "Хуурамч хариулт буруу",
  C1: "Үсэг буруу орлуулсан",
  C2: "Үсэг буруу орлуулсан (хувилбар)",
  D: "Үгийн зааг буруу",
  E1: "Дүрмийн алдаа (1-р төрөл)",
  E2: "Дүрмийн алдаа (2-р төрөл)",
  G1: "Сурган хүмүүжүүлэхийн асуудал (1)",
  G2: "Сурган хүмүүжүүлэхийн асуудал (2)",
  H4: "Агуулгын асуудал",
};

interface Props {
  item: ReviewItem;
  isEditMode: boolean;
  isSaving: boolean;
  savedEdits: Partial<TaskContent> | null;
  onSubmit: (action: ReviewAction) => void;
  onSaveEdit: () => void;
  isPending: boolean;
}

export interface ReviewPanelRef {
  /** Focus the reviewer note textarea (R shortcut). */
  focusNote: () => void;
  /** Trigger an action programmatically, running the same validation as a button click. */
  triggerAction: (action: ReviewAction["action"]) => void;
}

export const ReviewPanel = forwardRef<ReviewPanelRef, Props>(
  function ReviewPanel(
    { item, isEditMode, isSaving, savedEdits, onSubmit, onSaveEdit, isPending },
    ref,
  ) {
    const [note, setNote] = useState("");
    const [noteError, setNoteError] = useState("");

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Keep a ref to handleAction so useImperativeHandle stays stable
    const handleActionRef = useRef<(action: ReviewAction["action"]) => void>(
      () => {},
    );

    function handleAction(action: ReviewAction["action"]) {
      if (action === "reject" && !note.trim()) {
        setNoteError("Энэ үйлдэлд тэмдэглэл шаардлагатай.");
        textareaRef.current?.focus();
        return;
      }
      setNoteError("");
      onSubmit({
        action,
        note: note.trim(),
        edited_task: savedEdits ?? undefined,
      });
    }

    // Sync the ref after every render so triggerAction always uses fresh state
    useLayoutEffect(() => {
      handleActionRef.current = handleAction;
    });

    useImperativeHandle(
      ref,
      () => ({
        focusNote: () => textareaRef.current?.focus(),
        triggerAction: (action) => handleActionRef.current(action),
      }),
      [],
    );

    const approveDisabled = isEditMode || isPending;
    const actionDisabled = isPending;

    return (
      <div className="space-y-5">
        {/* Section 1: AI flags (shown only when flags exist) */}
        {item.ai_review_issues.length > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h2 className="text-sm font-semibold mb-2 text-yellow-800">
              AI тэмдэглэл
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {item.ai_review_issues.map((code) => (
                <span
                  key={code}
                  className="rounded border border-yellow-300 bg-white px-2 py-0.5 text-xs font-medium text-yellow-900"
                >
                  {code} — {FLAG_LABELS[code] ?? code}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Reviewer note */}
        <div className="rounded-lg border border-border bg-card p-5">
          <label
            htmlFor="reviewer-note"
            className="block text-sm font-semibold mb-2"
          >
            Хянагчийн тэмдэглэл
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (устгах / засах үед заавал)
            </span>
          </label>
          <textarea
            ref={textareaRef}
            id="reviewer-note"
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none",
              noteError ? "border-destructive" : "border-border",
            )}
            rows={3}
            placeholder="Агуулгын багийнхны тэмдэглэл нэмнэ үү…"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (noteError) setNoteError("");
            }}
          />
          {noteError && (
            <p className="mt-1 text-xs text-destructive">{noteError}</p>
          )}
        </div>

        {/* Section 3: Actions */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Шийдвэр</h2>

          <div className="flex flex-col gap-2">
            {/* Tooltip wrapper — hover works because the wrapper div keeps pointer-events,
              while the disabled button has pointer-events-none */}
            <div className="group relative">
              <ActionButton
                label={isPending ? "Илгээж байна…" : "Батлах"}
                shortcut="A"
                variant="approve"
                disabled={approveDisabled}
                onClick={() => handleAction("approve")}
              />
              {isEditMode && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Эхлэн засварыг хадгала
                  <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                </div>
              )}
            </div>

            <ActionButton
              label="Устгах"
              shortcut="X"
              variant="reject"
              disabled={actionDisabled}
              onClick={() => handleAction("reject")}
            />

            {isEditMode && (
              <ActionButton
                label={isSaving ? "Хадгалж байна…" : "Хадгалах"}
                shortcut="S"
                variant="save"
                disabled={isSaving}
                onClick={onSaveEdit}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

function ActionButton({
  label,
  shortcut,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  shortcut: string;
  variant: "approve" | "reject" | "save";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "save" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "approve" && "bg-green-600 text-white hover:bg-green-700",
        variant === "reject" &&
          "border border-red-200 bg-red-100 text-red-700 hover:bg-red-200",
      )}
    >
      {label}
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-current/20 bg-current/10 px-1 font-mono text-xs opacity-60">
        {shortcut}
      </kbd>
    </button>
  );
}

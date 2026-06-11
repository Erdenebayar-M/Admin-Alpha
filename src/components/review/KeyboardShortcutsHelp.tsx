"use client";

import { useEffect } from "react";

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ["A"], description: "Даалгавар батлах" },
  { keys: ["R"], description: "Тэмдэглэл рүү шилжих" },
  { keys: ["X"], description: "Даалгавар устгах" },
  { keys: ["E"], description: "Засах горим нэмэх/хасах" },
  { keys: ["S"], description: "Засварыг хадгалах (засах горимд)" },
  { keys: ["Esc"], description: "Дараалал руу буцах" },
  { keys: ["←"], description: "Өмнөх зүйл" },
  { keys: ["→"], description: "Дараагийн зүйл" },
  { keys: ["?"], description: "Энэ тусламжийг харах" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: Props) {
  // Close on Escape independently of the main useHotkeys (which is disabled
  // while this modal is open)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold">Гарын товчлол</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            ×
          </button>
        </div>

        <table className="w-full text-sm">
          <tbody>
            {SHORTCUTS.map(({ keys, description }) => (
              <tr
                key={description}
                className="border-t border-border first:border-t-0"
              >
                <td className="py-2.5 pl-5 pr-3 w-28">
                  <div className="flex items-center gap-1">
                    {keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs leading-none">
                          {k}
                        </kbd>
                        {i < keys.length - 1 && (
                          <span className="text-muted-foreground text-xs">
                            +
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 pr-5 text-muted-foreground">
                  {description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Оруулгын талбарт байхад товчлол ажиллахгүй.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Small trigger button rendered in the page header. */
export function ShortcutsHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Гарын товчлол (?)"
      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      ?
    </button>
  );
}

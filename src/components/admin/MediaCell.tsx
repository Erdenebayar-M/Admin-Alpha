"use client";

import { useRef, useState } from "react";

interface Props {
  audioUrl: string | null;
  imageUrl: string | null;
}

export function MediaCell({ audioUrl, imageUrl }: Props) {
  const [tooltip, setTooltip] = useState<{
    type: "audio" | "image";
    rect: DOMRect;
  } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!audioUrl && !imageUrl) return null;

  function show(type: "audio" | "image", e: React.MouseEvent<HTMLSpanElement>) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTooltip({ type, rect: e.currentTarget.getBoundingClientRect() });
  }

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setTooltip(null), 80);
  }

  function cancelHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }

  const top = tooltip ? tooltip.rect.top - 8 : 0;
  const left = tooltip ? tooltip.rect.left + tooltip.rect.width / 2 : 0;

  return (
    <div className="flex items-center gap-1.5">
      {audioUrl && (
        <span
          onMouseEnter={(e) => show("audio", e)}
          onMouseLeave={scheduleHide}
          className="flex h-6 w-6 cursor-default items-center justify-center rounded bg-muted text-muted-foreground transition-colors hover:bg-blue-100 hover:text-blue-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12V4.5" />
          </svg>
        </span>
      )}
      {imageUrl && (
        <span
          onMouseEnter={(e) => show("image", e)}
          onMouseLeave={scheduleHide}
          className="flex h-6 w-6 cursor-default items-center justify-center rounded bg-muted text-muted-foreground transition-colors hover:bg-purple-100 hover:text-purple-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3h18M3 21h18M3 12h18" />
          </svg>
        </span>
      )}

      {tooltip && (
        <div
          style={{
            position: "fixed",
            top,
            left,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          {tooltip.type === "audio" && audioUrl && (
            <div className="w-56 rounded-lg border border-border bg-popover p-2 shadow-xl">
              <audio controls src={audioUrl} className="h-8 w-full" />
            </div>
          )}
          {tooltip.type === "image" && imageUrl && (
            <div className="rounded-lg border border-border bg-popover p-1.5 shadow-xl">
              <img src={imageUrl} alt="" className="max-h-40 max-w-[200px] rounded object-contain" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

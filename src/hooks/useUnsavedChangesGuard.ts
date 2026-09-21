"use client";

import { useEffect, useRef } from "react";

/**
 * Warns before leaving the page while `dirty`. The App Router has no
 * route-change event to block, so each way out is covered separately:
 * - reload/close/external links: the browser's own `beforeunload` prompt;
 * - in-app links: same-origin anchor clicks intercepted in the capture phase,
 *   before `<Link>` handles them;
 * - Back: once dirty, a duplicate of the current history entry is pushed, so
 *   Back first lands on this same page, where the user is asked before the
 *   real Back is replayed. Once clean, that duplicate is skipped silently.
 *   After a confirmed leave or a successful save, Back may take one extra
 *   press over a stale duplicate entry — never a lost edit.
 */
export function useUnsavedChangesGuard(dirty: boolean, message: string) {
  const dirtyRef = useRef(dirty);
  const sentinelRef = useRef(false);
  // Set once the user has confirmed leaving, so a Back that unloads the
  // document doesn't ask a second time through beforeunload.
  const leavingRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
    if (dirty && !sentinelRef.current) {
      sentinelRef.current = true;
      window.history.pushState(window.history.state, "", window.location.href);
    }
  }, [dirty]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current || leavingRef.current) return;
      e.preventDefault();
    }

    function onClick(e: MouseEvent) {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // opens a new tab — nothing is lost
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return; // beforeunload covers it
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onPopState() {
      if (!sentinelRef.current) return;
      sentinelRef.current = false; // Back just consumed the duplicate entry
      if (dirtyRef.current && !window.confirm(message)) {
        sentinelRef.current = true;
        window.history.pushState(window.history.state, "", window.location.href);
        return;
      }
      leavingRef.current = dirtyRef.current;
      window.history.back();
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick, true);
    };
  }, [message]);
}

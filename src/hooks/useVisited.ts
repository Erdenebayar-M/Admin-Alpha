import { useCallback, useState } from "react";

export function useVisited(storageKey: string) {
  const [visited, setVisited] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  const markVisited = useCallback(
    (id: string) => {
      setVisited((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {}
        return next;
      });
    },
    [storageKey],
  );

  return { visited, markVisited };
}

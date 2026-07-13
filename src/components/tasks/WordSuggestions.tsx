"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ImageIcon, Search, Volume2 } from "lucide-react";
import { getWords } from "@/lib/api";
import type { WordBankEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ToggleChip } from "./shared";

const PER_PAGE = 20;

interface WordSuggestionsProps {
  gradeBand: string[];
  taskType: string;
  skill?: string;
  secondarySkill?: string;
  appLevel?: string;
  difficulty?: number;
  selectedWordId: string | null;
  onSelectWord: (id: string | null) => void;
  showImageAction: boolean;
  onUseImage: (word: WordBankEntry) => void;
}

/**
 * Reference list of words eligible for the current grade + task type — a
 * recommendation the human can look at while typing, not an auto-fill.
 * Clicking a chip only marks "this is the word I'm using" (selectedWordId),
 * which powers the word-bank audio dual-write for word-dictation types.
 * Scrolls to load more (IntersectionObserver) and supports a text search.
 */
export function WordSuggestions({
  gradeBand,
  taskType,
  skill,
  secondarySkill,
  appLevel,
  difficulty,
  selectedWordId,
  onSelectWord,
  showImageAction,
  onUseImage,
}: WordSuggestionsProps) {
  const grade = gradeBand[0];

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["word-suggestions", grade, taskType, skill, secondarySkill, appLevel, difficulty, q],
    queryFn: ({ pageParam }) =>
      getWords({
        grade: grade as "G1" | "G2" | "G3" | "G4",
        task_type: taskType,
        skill,
        secondary_skill: secondarySkill,
        app_level: appLevel,
        difficulty,
        q: q || undefined,
        page: pageParam,
        per_page: PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.meta.has_next ? allPages.length + 1 : undefined),
    enabled: !!grade && !!taskType,
  });

  const words = data?.pages.flatMap((p) => p.words) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  // Read the latest hasNextPage/isFetchingNextPage via refs rather than as
  // effect dependencies, so the observer is created once per scroll
  // container and never torn down/recreated mid-fetch — recreating it on
  // every fetch-state change risks dropping a queued intersection callback
  // and silently stalling after the first auto-load.
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [hasNextPage, isFetchingNextPage]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPageRef.current && !isFetchingNextPageRef.current) {
          void fetchNextPage();
        }
      },
      { root: containerRef.current, rootMargin: "80px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // Re-attach whenever the scrollable list (re)mounts — e.g. going from
    // the empty/loading state to having results — since the sentinel div
    // doesn't exist yet on earlier renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNextPage, words.length > 0]);

  if (!grade || !taskType) return null;

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Санал болгох үгс{total > 0 && ` (${total})`}
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Үг хайх…"
          className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground animate-pulse">Ачааллаж байна…</p>
      ) : words.length === 0 ? (
        <p className="text-xs text-muted-foreground">Энэ анги/төрөлд тохирох үг олдсонгүй.</p>
      ) : showImageAction ? (
        <div ref={containerRef} className="max-h-80 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-2">
            {words.map((w) => {
              const hasImage = w.image_ok && !!w.image_url;
              const selected = selectedWordId === w.id;
              return (
                <div
                  key={w.id}
                  className={cn(
                    "rounded-md border p-1.5 space-y-1",
                    selected ? "border-primary ring-1 ring-primary" : "border-border",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectWord(selected ? null : w.id)}
                    className="block w-full"
                  >
                    {hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.image_url!}
                        alt={w.word}
                        className="aspect-square w-full rounded object-cover bg-muted"
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded bg-muted">
                        <ImageIcon className="size-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <p
                      className={cn(
                        "mt-1 truncate text-center text-xs font-medium",
                        selected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {w.word}
                    </p>
                  </button>
                  {hasImage && (
                    <button
                      type="button"
                      onClick={() => onUseImage(w)}
                      className={cn(
                        "w-full rounded border border-border px-1 py-0.5 text-[10px] font-medium text-muted-foreground",
                        "hover:border-primary hover:text-foreground transition-colors",
                      )}
                    >
                      энэ зургийг ашиглах
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div ref={sentinelRef} />
          {isFetchingNextPage && (
            <p className="mt-2 text-xs text-muted-foreground animate-pulse">Ачааллаж байна…</p>
          )}
        </div>
      ) : (
        <div ref={containerRef} className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => (
              <div key={w.id} className="flex items-center gap-1">
                <ToggleChip
                  label={w.word}
                  selected={selectedWordId === w.id}
                  onClick={() => onSelectWord(selectedWordId === w.id ? null : w.id)}
                />
                {(w.image_ok || w.audio_ok) && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {w.image_ok && (
                      <span title="Энэ үгэнд зураг бэлэн байгаа">
                        <ImageIcon className="size-3" />
                      </span>
                    )}
                    {w.audio_ok && (
                      <span title="Энэ үгэнд аудио бэлэн байгаа">
                        <Volume2 className="size-3" />
                      </span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div ref={sentinelRef} />
          {isFetchingNextPage && (
            <p className="text-xs text-muted-foreground animate-pulse">Ачааллаж байна…</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getWords } from "@/lib/api";
import type { WordBankEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ToggleChip } from "./shared";

interface WordSuggestionsProps {
  gradeBand: string[];
  taskType: string;
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
 */
export function WordSuggestions({
  gradeBand,
  taskType,
  selectedWordId,
  onSelectWord,
  showImageAction,
  onUseImage,
}: WordSuggestionsProps) {
  const grade = gradeBand[0];

  const { data, isLoading } = useQuery({
    queryKey: ["word-suggestions", grade, taskType],
    queryFn: () => getWords({ grade: grade as "G1" | "G2" | "G3" | "G4", task_type: taskType, per_page: 30 }),
    enabled: !!grade && !!taskType,
  });

  if (!grade || !taskType) return null;

  const words = data?.words ?? [];

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Санал болгох үгс</p>
      {isLoading ? (
        <p className="text-xs text-muted-foreground animate-pulse">Ачааллаж байна…</p>
      ) : words.length === 0 ? (
        <p className="text-xs text-muted-foreground">Энэ анги/төрөлд тохирох үг олдсонгүй.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <div key={w.id} className="flex items-center gap-1">
              <ToggleChip
                label={w.word}
                selected={selectedWordId === w.id}
                onClick={() => onSelectWord(selectedWordId === w.id ? null : w.id)}
              />
              {(w.image_ok || w.audio_ok) && (
                <span className="text-[10px] text-muted-foreground">
                  {w.image_ok && "🖼"}
                  {w.audio_ok && "🔊"}
                </span>
              )}
              {showImageAction && w.image_ok && w.image_url && (
                <button
                  type="button"
                  onClick={() => onUseImage(w)}
                  className={cn(
                    "rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
                    "hover:border-primary hover:text-foreground transition-colors",
                  )}
                >
                  зургийг ашиглах
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

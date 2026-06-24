"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { getWords, getWordFacets, type WordFilters } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { tableStyles, TableFooter, SkeletonRows } from "@/components/admin/data-table";
import { ImportWordsModal } from "@/components/words/ImportWordsModal";
import type { WordBankEntry } from "@/lib/types";

const PER_PAGE = 50;

function ComplexityCell({ m, s, mo }: { m: number | null; s: number | null; mo: number | null }) {
  const fmt = (n: number | null) => (n == null ? "—" : String(n));
  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground" title="Утга / Зөв бичих / Морфологи">
      {fmt(m)}·{fmt(s)}·{fmt(mo)}
    </span>
  );
}

export function WordsTab() {
  const [grade, setGrade] = useState<number | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [appLevel, setAppLevel] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);

  // Debounce the search box so we don't fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [grade, category, appLevel, debouncedSearch]);

  const { data: facets } = useQuery({
    queryKey: ["word-facets"],
    queryFn: getWordFacets,
    staleTime: 60_000,
  });

  const filters: WordFilters = {
    ...(grade !== "all" ? { grade } : {}),
    ...(category !== "all" ? { category } : {}),
    ...(appLevel !== "all" ? { app_level: appLevel } : {}),
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    page,
    per_page: PER_PAGE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["words", filters],
    queryFn: () => getWords(filters),
    staleTime: 30_000,
  });

  const words = data?.words ?? [];
  const total = data?.total ?? 0;
  const hasNext = data?.meta.has_next ?? false;

  const selectCls =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="relative px-4 py-6 sm:px-6">
      {/* Filter card */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-6">
          {/* Grade group */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Анги</span>
            <div className="flex gap-1.5">
              {(["all", ...(facets?.grades ?? [])] as const).map((g) => (
                <button
                  key={String(g)}
                  type="button"
                  onClick={() => setGrade(g === "all" ? "all" : Number(g))}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    grade === g
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {g === "all" ? "Бүгд" : `${g}-р анги`}
                </button>
              ))}
            </div>
          </div>

          {/* App level */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Түвшин</span>
            <select value={appLevel} onChange={(e) => setAppLevel(e.target.value)} className={selectCls}>
              <option value="all">Бүх түвшин</option>
              {(facets?.app_levels ?? []).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Сэдэв</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(selectCls, "max-w-[220px]")}>
              <option value="all">Бүх сэдэв</option>
              {(facets?.categories ?? []).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Хайх</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Үг хайх…"
              className={cn(selectCls, "w-44")}
            />
          </div>

          {/* Import */}
          <div className="ml-auto flex items-end">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Upload className="size-4" />
              Xlsx оруулах
            </button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={tableStyles.wrapper}>
        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Үг</th>
                <th className={tableStyles.th}>Анги</th>
                <th className={tableStyles.th}>Түвшин</th>
                <th className={tableStyles.th}>Сэдэв</th>
                <th className={tableStyles.th}>Үгийн аймаг</th>
                <th className={tableStyles.th}>Зөв бичих таг</th>
                <th className={tableStyles.th} title="Утга / Зөв бичих / Морфологи">Төвөгшил</th>
                <th className={tableStyles.th}>Үсэг</th>
                <th className={tableStyles.th}>Үе</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {isLoading ? (
                <SkeletonRows count={10} cols={9} />
              ) : words.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      message="Үг олдсонгүй"
                      subMessage="Шүүлтүүрийг өөрчлөх эсвэл xlsx файл оруулна уу"
                    />
                  </td>
                </tr>
              ) : (
                words.map((w: WordBankEntry) => (
                  <tr key={w.id} className="transition-colors hover:bg-accent/50">
                    <td className={cn(tableStyles.cell, "font-medium")}>{w.word}</td>
                    <td className={tableStyles.cellMuted}>{w.grade ?? "—"}</td>
                    <td className={tableStyles.cellMuted}>{w.app_level ?? "—"}</td>
                    <td className={cn(tableStyles.cell, "max-w-[220px]")}>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{w.category || "—"}</span>
                    </td>
                    <td className={tableStyles.cellMuted}>{w.part_of_speech ?? "—"}</td>
                    <td className={cn(tableStyles.cell, "max-w-[200px]")}>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{w.spelling_tag || "—"}</span>
                    </td>
                    <td className={tableStyles.cell}>
                      <ComplexityCell m={w.meaning_complexity} s={w.spelling_complexity} mo={w.morph_complexity} />
                    </td>
                    <td className={tableStyles.cellMuted}>{w.char_count}</td>
                    <td className={tableStyles.cellMuted}>{w.syllable_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && words.length > 0 && <TableFooter count={total} label="үг" />}
      </div>

      {/* Pagination */}
      {!isLoading && total > PER_PAGE && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Өмнөх
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {page} / {Math.max(1, Math.ceil(total / PER_PAGE))}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Дараах →
          </button>
        </div>
      )}

      <ImportWordsModal open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

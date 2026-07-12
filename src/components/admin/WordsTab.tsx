"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, EyeOff, Eye, Loader2, Plus } from "lucide-react";
import {
  getWords,
  getWordFacets,
  deactivateWord,
  bulkDeactivateWords,
  connectWordToRoot,
  type WordFilters,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { tableStyles, TableFooter, SkeletonRows } from "@/components/admin/data-table";
import { MediaCell } from "@/components/admin/MediaCell";
import { EditWordModal } from "@/components/words/EditWordModal";
import { CreateWordModal } from "@/components/words/CreateWordModal";
import { useModalStore } from "@/lib/modal-store";
import type { WordBankEntry } from "@/lib/types";

const PER_PAGE = 50;

const btnBase =
  "min-w-[2rem] rounded-lg border px-2 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const btnIdle = "border-border bg-background text-foreground hover:bg-muted";
const btnActive = "border-primary bg-primary text-primary-foreground shadow-sm";

function Pagination({
  page,
  total,
  perPage,
  onChange,
}: {
  page: number;
  total: number;
  perPage: number;
  onChange: (p: number) => void;
}) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const [jumpValue, setJumpValue] = useState("");

  function submitJump() {
    const n = parseInt(jumpValue, 10);
    if (Number.isFinite(n)) {
      onChange(Math.min(Math.max(n, 1), lastPage));
    }
    setJumpValue("");
  }

  const range: (number | "…")[] = [];
  const add = (n: number) => {
    if (!range.length || range[range.length - 1] !== n) range.push(n);
  };
  for (let p = 1; p <= lastPage; p++) {
    if (p === 1 || p === lastPage || Math.abs(p - page) <= 2) {
      if (range.length && typeof range[range.length - 1] === "number" && (range[range.length - 1] as number) < p - 1) {
        range.push("…");
      }
      add(p);
    }
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      <button type="button" disabled={page <= 1} onClick={() => onChange(1)} className={cn(btnBase, btnIdle)} title="Эхний хуудас">«</button>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={cn(btnBase, btnIdle)}>‹</button>

      {range.map((r, i) =>
        r === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">…</span>
        ) : (
          <button key={r} type="button" onClick={() => onChange(r)} className={cn(btnBase, r === page ? btnActive : btnIdle)}>
            {r}
          </button>
        ),
      )}

      <button type="button" disabled={page >= lastPage} onClick={() => onChange(page + 1)} className={cn(btnBase, btnIdle)}>›</button>
      <button type="button" disabled={page >= lastPage} onClick={() => onChange(lastPage)} className={cn(btnBase, btnIdle)} title="Сүүлийн хуудас">»</button>

      <span className="ml-2 text-xs text-muted-foreground tabular-nums">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total} үг
      </span>

      <div className="ml-2 flex items-center gap-1">
        <input
          type="number"
          min={1}
          max={lastPage}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitJump();
          }}
          placeholder={String(page)}
          className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <button type="button" onClick={submitJump} className={cn(btnBase, btnIdle)}>
          Очих
        </button>
      </div>
    </div>
  );
}

function ComplexityCell({ m, s, mo }: { m: number | null; s: number | null; mo: number | null }) {
  const fmt = (n: number | null) => (n == null ? "—" : String(n));
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const tooltip = anchor
    ? createPortal(
        <span
          className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-2 text-left text-xs text-popover-foreground shadow-xl"
          style={{ left: anchor.x, top: anchor.y - 8, transform: "translate(-50%, -100%)" }}
        >
          <span className="block">Утгын төвөгшил: <b>{fmt(m)}</b></span>
          <span className="block">Зөв бичих төвөгшил: <b>{fmt(s)}</b></span>
          <span className="block">Морфологийн төвөгшил: <b>{fmt(mo)}</b></span>
        </span>,
        document.body,
      )
    : null;

  return (
    <span
      className="cursor-help font-mono text-xs tabular-nums text-muted-foreground"
      onMouseEnter={(e) => setAnchor({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => setAnchor({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setAnchor(null)}
    >
      {fmt(m)}·{fmt(s)}·{fmt(mo)}
      {tooltip}
    </span>
  );
}

function DeactivateConfirm({
  word,
  onCancel,
  onConfirm,
  loading,
}: {
  word: WordBankEntry;
  onCancel: () => void;
  onConfirm: (mode: "solo" | "detach" | "cascade") => void;
  loading: boolean;
}) {
  const formCount = word.forms.length;
  const destructiveBtn =
    "flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-40";
  const neutralBtn =
    "flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-base font-semibold text-foreground">Үгийг идэвхгүй болгох уу?</p>
        <p className="mb-5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{word.word}</span> — устгагдахгүй, зөвхөн нуугдана. Дараа нь дахин идэвхжүүлж болно.
          {formCount > 0 && (
            <> Энэ үг <span className="font-medium text-foreground">{formCount}</span> хэлбэртэй.</>
          )}
        </p>
        {formCount > 0 ? (
          <div className="flex flex-col gap-2">
            <button type="button" disabled={loading} onClick={() => onConfirm("detach")} className={neutralBtn}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Зөвхөн үндсийг устгах (хэлбэрүүд үлдэнэ)
            </button>
            <button type="button" disabled={loading} onClick={() => onConfirm("cascade")} className={destructiveBtn}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Хэлбэрүүдийн хамт устгах
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Болих
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Болих
            </button>
            <button type="button" disabled={loading} onClick={() => onConfirm("solo")} className={destructiveBtn}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Идэвхгүй болгох
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function BulkDeactivateConfirm({
  count,
  onCancel,
  onConfirm,
  loading,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const destructiveBtn =
    "flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-40";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-base font-semibold text-foreground">
          {count} үгийг идэвхгүй болгох уу?
        </p>
        <p className="mb-5 text-sm text-muted-foreground">
          Устгагдахгүй, зөвхөн нуугдана. Дараа нь дахин идэвхжүүлж болно. Сонгосон үгсийн хэлбэрүүд
          (өөрсдийг нь сонгоогүй бол) хөндөгдөхгүй.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Болих
          </button>
          <button type="button" disabled={loading} onClick={onConfirm} className={destructiveBtn}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Идэвхгүй болгох
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function WordsTab() {
  const queryClient = useQueryClient();
  const showPageToast = useModalStore((s) => s.showPageToast);

  const [grade, setGrade] = useState<"G1" | "G2" | "G3" | "G4" | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [appLevel, setAppLevel] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<"true" | "false" | "all">("true");
  const [hasForms, setHasForms] = useState<"all" | "true">("all");
  const [scope, setScope] = useState<"roots" | "all">("roots");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editWordId, setEditWordId] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<WordBankEntry | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [creatingFrom, setCreatingFrom] = useState<WordBankEntry | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeactivating, setBulkDeactivating] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [grade, category, appLevel, activeFilter, hasForms, scope, debouncedSearch]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [grade, category, appLevel, activeFilter, hasForms, scope, debouncedSearch, page]);

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
    ...(hasForms === "true" ? { has_forms: "true" as const } : {}),
    scope,
    active: activeFilter,
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
  const editWord = words.find((w) => w.id === editWordId) ?? null;

  const selectableWords = words.filter((w) => w.is_active);
  const allSelected = selectableWords.length > 0 && selectableWords.every((w) => selectedIds.has(w.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableWords.map((w) => w.id)));
  }

  async function handleBulkDeactivate() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkDeactivating(true);
    try {
      const result = await bulkDeactivateWords(ids);
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      showPageToast({ type: "success", message: `${result.deactivated} үг идэвхгүй болгогдлоо` });
      setSelectedIds(new Set());
      setConfirmBulk(false);
    } catch (e) {
      showPageToast({ type: "error", message: e instanceof Error ? e.message : "Алдаа гарлаа" });
    } finally {
      setBulkDeactivating(false);
    }
  }

  async function handleDeactivateConfirm(mode: "solo" | "detach" | "cascade") {
    if (!confirmDeactivate) return;
    const target = confirmDeactivate;
    setDeactivating(true);
    try {
      await deactivateWord(target.id, mode);
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      const suffix =
        mode === "detach" ? " (хэлбэрүүд үлдлээ)" : mode === "cascade" ? " (хэлбэрүүдийн хамт)" : "";
      showPageToast({ type: "success", message: `"${target.word}" идэвхгүй болгогдлоо${suffix}` });
      setConfirmDeactivate(null);
    } catch (e) {
      showPageToast({ type: "error", message: e instanceof Error ? e.message : "Алдаа гарлаа" });
    } finally {
      setDeactivating(false);
    }
  }

  async function handleReactivate(w: WordBankEntry) {
    try {
      const { patchWord } = await import("@/lib/api");
      await patchWord(w.id, { is_active: true });
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      showPageToast({ type: "success", message: `"${w.word}" дахин идэвхжүүлэгдлээ` });
    } catch (e) {
      showPageToast({ type: "error", message: e instanceof Error ? e.message : "Алдаа гарлаа" });
    }
  }

  async function handleDropConnect(draggedId: string, target: WordBankEntry) {
    setDragOverId(null);
    if (draggedId === target.id || !target.is_active) return;
    try {
      const r = await connectWordToRoot(draggedId, target.word);
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      showPageToast({ type: "success", message: `→ "${r.root_word}"-д холбогдлоо` });
    } catch (e) {
      showPageToast({ type: "error", message: e instanceof Error ? e.message : "Алдаа гарлаа" });
    }
  }

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
                  onClick={() => setGrade(g as "G1" | "G2" | "G3" | "G4" | "all")}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    grade === g
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {g === "all" ? "Бүгд" : `${g.slice(1)}-р анги`}
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

          {/* Active filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Төлөв</span>
            <div className="flex gap-1.5">
              {(["true", "false", "all"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setActiveFilter(v)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    activeFilter === v
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {v === "true" ? "Идэвхтэй" : v === "false" ? "Идэвхгүй" : "Бүгд"}
                </button>
              ))}
            </div>
          </div>

          {/* Scope filter — roots only vs. flattened list including form words */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Харах</span>
            <div className="flex gap-1.5">
              {(["roots", "all"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setScope(v)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    scope === v
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {v === "roots" ? "Зөвхөн үндэс" : "Бүгд (хэлбэрийн хамт)"}
                </button>
              ))}
            </div>
          </div>

          {/* Has-forms filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Хэлбэр</span>
            <div className="flex gap-1.5">
              {(["all", "true"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setHasForms(v)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    hasForms === v
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {v === "all" ? "Бүгд" : "Хэлбэртэй"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk selection bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} сонгогдсон</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Цуцлах
            </button>
            <button
              type="button"
              onClick={() => setConfirmBulk(true)}
              className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-destructive/90"
            >
              Идэвхгүй болгох ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className={tableStyles.wrapper}>
        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th} />
                <th className={tableStyles.th}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    disabled={selectableWords.length === 0}
                    className="accent-primary"
                    aria-label="Бүгдийг сонгох"
                  />
                </th>
                <th className={tableStyles.th}>Үг</th>
                <th className={tableStyles.th}>Анги</th>
                <th className={tableStyles.th}>Түвшин</th>
                <th className={tableStyles.th}>Сэдэв</th>
                <th className={tableStyles.th}>Үгийн аймаг</th>
                <th className={tableStyles.th}>Зөв бичих таг</th>
                <th className={tableStyles.th}>Төвөгшил</th>
                <th className={tableStyles.th}>Үсэг</th>
                <th className={tableStyles.th}>Үе</th>
                <th className={tableStyles.th}>Хэлбэрүүд</th>
                <th className={tableStyles.th}>Зураг</th>
                <th className={tableStyles.th}>Үйлдэл</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {isLoading ? (
                <SkeletonRows count={10} cols={14} />
              ) : words.length === 0 ? (
                <tr>
                  <td colSpan={14}>
                    <EmptyState
                      message="Үг олдсонгүй"
                      subMessage="Шүүлтүүрийг өөрчлөх эсвэл хайлтаа өөрчлөнө үү"
                    />
                  </td>
                </tr>
              ) : (
                words.map((w: WordBankEntry) => (
                  <tr
                    key={w.id}
                    draggable={w.is_active}
                    onDragStart={(e) => {
                      setDraggingId(w.id);
                      e.dataTransfer.setData("text/plain", w.id);
                      e.dataTransfer.effectAllowed = "link";
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverId(null);
                    }}
                    onDragOver={(e) => {
                      if (!w.is_active) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "link";
                    }}
                    onDragEnter={() => {
                      if (w.is_active) setDragOverId(w.id);
                    }}
                    onDragLeave={() => setDragOverId((prev) => (prev === w.id ? null : prev))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedId = e.dataTransfer.getData("text/plain");
                      if (draggedId) handleDropConnect(draggedId, w);
                    }}
                    title="Чирж өөр үгэн дээр тавьж холбоно уу"
                    className={cn(
                      "transition-colors hover:bg-accent/50",
                      !w.is_active && "opacity-50",
                      w.is_edited && "bg-amber-50/60 dark:bg-amber-900/10",
                      draggingId === w.id && "opacity-40",
                      dragOverId === w.id && draggingId !== w.id && "bg-primary/10 outline outline-2 outline-primary",
                    )}
                  >
                    <td className={tableStyles.cell}>
                      <button
                        type="button"
                        title={`"${w.word}"-ийн талбарууд дээр үндэслэн шинэ үг нэмэх`}
                        onClick={() => setCreatingFrom(w)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </td>
                    <td className={tableStyles.cell}>
                      {w.is_active && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(w.id)}
                          onChange={() => toggleSelect(w.id)}
                          className="accent-primary"
                          aria-label={`"${w.word}" сонгох`}
                        />
                      )}
                    </td>
                    <td className={cn(tableStyles.cell, "font-medium")}>
                      <span className="flex items-center gap-1">
                        {w.word}
                        {w.balarhai_unknown && (
                          <span title="Балархай эгшиг — шалгах шаардлагатай" className="text-amber-500">⚠</span>
                        )}
                        {w.is_edited && (
                          <span title="Админ засварласан" className="text-amber-600">✎</span>
                        )}
                        {w.root_word && (
                          <span
                            title={`"${w.root_word.word}"-ийн хэлбэр`}
                            className="text-xs font-normal text-muted-foreground"
                          >
                            ↳ {w.root_word.word}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className={tableStyles.cellMuted}>{w.grade_band.length ? w.grade_band.map((g) => g.slice(1)).join(", ") : "—"}</td>
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
                    <td className={cn(tableStyles.cell, "max-w-[260px]")}>
                      {w.forms.length ? (
                        <span
                          className="flex items-center gap-1.5"
                          title={w.forms.map((f) => f.word).join(", ")}
                        >
                          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                            {w.forms.length}
                          </span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {w.forms.map((f) => f.word).join(", ")}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={tableStyles.cell}>
                      <MediaCell imageUrl={w.image_url} audioUrl={null} />
                    </td>
                    <td className={tableStyles.cell}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Засах"
                          onClick={() => setEditWordId(w.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        {w.is_active ? (
                          <button
                            type="button"
                            title="Идэвхгүй болгох"
                            onClick={() => setConfirmDeactivate(w)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <EyeOff className="size-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Дахин идэвхжүүлэх"
                            onClick={() => handleReactivate(w)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
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
        <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage} />
      )}

      {/* Create modal */}
      {creatingFrom && (
        <CreateWordModal prototype={creatingFrom} onClose={() => setCreatingFrom(null)} />
      )}

      {/* Edit modal */}
      {editWord && (
        <EditWordModal word={editWord} onClose={() => setEditWordId(null)} />
      )}

      {/* Deactivate confirm */}
      {confirmDeactivate && (
        <DeactivateConfirm
          word={confirmDeactivate}
          onCancel={() => setConfirmDeactivate(null)}
          onConfirm={handleDeactivateConfirm}
          loading={deactivating}
        />
      )}

      {/* Bulk deactivate confirm */}
      {confirmBulk && (
        <BulkDeactivateConfirm
          count={selectedIds.size}
          onCancel={() => setConfirmBulk(false)}
          onConfirm={handleBulkDeactivate}
          loading={bulkDeactivating}
        />
      )}
    </div>
  );
}

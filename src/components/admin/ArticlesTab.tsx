"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Star, Trash2 } from "lucide-react";
import { getArticles, type ArticleFilters } from "@/lib/api";
import { ARTICLE_CATEGORIES, ARTICLE_STATUSES, type ArticleCategoryValue, type ArticleStatusValue } from "@/lib/article-types";
import { ARTICLE_CATEGORY_LABELS, ARTICLE_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lozenge } from "@/components/ui/lozenge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteArticleDialog } from "@/components/articles/DeleteArticleDialog";
import { tableStyles, TableToolbar, TableFooter, SkeletonRows } from "@/components/admin/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PER_PAGE = 20;
const ALL_VALUE = "all";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Pagination({
  page,
  total,
  perPage,
  hasNext,
  onChange,
}: {
  page: number;
  total: number;
  perPage: number;
  hasNext: boolean;
  onChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ‹ Өмнөх
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {from}–{to} / {total}
      </span>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onChange(page + 1)}>
        Дараах ›
      </Button>
    </div>
  );
}

export function ArticlesTab() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ArticleStatusValue | "all">("all");
  const [category, setCategory] = useState<ArticleCategoryValue | "all">("all");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function selectStatus(value: ArticleStatusValue | "all") {
    setStatus(value);
    setPage(1);
  }

  function selectCategory(value: ArticleCategoryValue | "all") {
    setCategory(value);
    setPage(1);
  }

  const filters: ArticleFilters = {
    ...(status !== "all" ? { status } : {}),
    ...(category !== "all" ? { category } : {}),
    ...(q ? { q } : {}),
    page,
    per_page: PER_PAGE,
  };

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["articles", filters],
    queryFn: () => getArticles(filters),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });

  const articles = data?.articles ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className={tableStyles.wrapper}>
        <TableToolbar
          resultCount={isLoading ? undefined : total}
          resultLabel="нийтлэл"
          loading={isLoading && !isPlaceholderData}
          left={
            <>
              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Гарчгаар хайх…"
                  className="pl-8"
                />
              </div>
              <Select value={status} onValueChange={(v) => selectStatus(v as ArticleStatusValue | "all")}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Төлөв" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Бүх төлөв</SelectItem>
                  {ARTICLE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ARTICLE_STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={(v) => selectCategory(v as ArticleCategoryValue | "all")}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Ангилал" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Бүх ангилал</SelectItem>
                  {ARTICLE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {ARTICLE_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          right={
            <Button asChild size="sm">
              <Link href="/admin/articles/new">
                <Plus />
                Шинэ нийтлэл
              </Link>
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Гарчиг</th>
                <th className={tableStyles.th}>Ангилал</th>
                <th className={tableStyles.th}>Төлөв</th>
                <th className={tableStyles.thCenter}>★</th>
                <th className={tableStyles.th}>Нийтэлсэн</th>
                <th className={tableStyles.th}>Шинэчилсэн</th>
                <th className={tableStyles.th}>
                  <span className="sr-only">Үйлдэл</span>
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {isLoading && !isPlaceholderData ? (
                <SkeletonRows count={8} cols={7} />
              ) : (
                articles.map((article) => (
                  <tr
                    key={article.id}
                    className={tableStyles.row}
                    onClick={() => router.push(`/admin/articles/${article.id}`)}
                  >
                    <td className={cn(tableStyles.cell, "font-medium text-foreground")}>{article.title}</td>
                    <td className={tableStyles.cell}>{ARTICLE_CATEGORY_LABELS[article.category]}</td>
                    <td className={tableStyles.cell}>
                      <Lozenge tone={ARTICLE_STATUS_META[article.status].tone}>
                        {ARTICLE_STATUS_META[article.status].label}
                      </Lozenge>
                    </td>
                    <td className={tableStyles.thCenter}>
                      {article.is_featured && <Star className="mx-auto size-3.5 fill-amber-400 text-amber-400" />}
                    </td>
                    <td className={tableStyles.cellMuted}>{fmtDate(article.published_at)}</td>
                    <td className={tableStyles.cellMuted}>{fmtDate(article.updated_at)}</td>
                    <td className={cn(tableStyles.cell, "w-px text-right")}>
                      {article.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Ноорог устгах"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setToDelete({ id: article.id, title: article.title });
                          }}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && articles.length === 0 && (
          <EmptyState message="Нийтлэл олдсонгүй" subMessage="Шүүлтүүрээ өөрчлөх эсвэл шинэ нийтлэл үүсгэнэ үү" />
        )}

        {total > PER_PAGE ? (
          <Pagination page={page} total={total} perPage={PER_PAGE} hasNext={data?.meta.has_next ?? false} onChange={setPage} />
        ) : (
          <TableFooter count={total} label="нийт нийтлэл" />
        )}
      </div>

      <DeleteArticleDialog article={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </div>
  );
}

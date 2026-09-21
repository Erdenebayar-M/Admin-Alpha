"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createArticle, getArticle, publishArticle, saveArticle, unpublishArticle } from "@/lib/api";
import { slugify } from "@/lib/article-slug";
import {
  articleBodyErrors,
  articleFieldErrors,
  isVersionConflict,
  missingImageAltErrors,
  type ArticleFieldErrors,
  type ArticleMetadataField,
} from "@/lib/article-errors";
import {
  EMPTY_ARTICLE_FORM,
  articleToForm,
  formsEqual,
  isSlugLocked,
  toCreatePayload,
  toSavePayload,
  type ArticleFormState,
} from "@/lib/article-form";
import { getArticlePublishIssues, type ArticleBlock } from "@/lib/article-types";
import type { Article } from "@/lib/types";

const BLOCKS_MARKED = "Улаанаар тэмдэглэсэн блокуудыг засна уу.";
const PUBLISH_FAILED = "Нийтэлж чадсангүй";
const UNPUBLISH_FAILED = "Ноорог болгож чадсангүй";

/**
 * Editor state for one Article: the loaded server row, the local form, dirty
 * tracking and the manual Save (POST on a new Article, version-guarded PUT
 * after that). Server data is applied to the form only on first load, after a
 * save, and on an explicit reload — never by a background refetch, so local
 * edits are never silently replaced.
 */
export function useArticleEditor(initialId: string | undefined) {
  const queryClient = useQueryClient();
  const [articleId, setArticleId] = useState(initialId);
  const [server, setServer] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleFormState>(EMPTY_ARTICLE_FORM);
  const [baseline, setBaseline] = useState<ArticleFormState>(EMPTY_ARTICLE_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ArticleFieldErrors>({});
  const [errorBanner, setErrorBanner] = useState<{ message: string; details: string[] } | null>(null);
  const [conflict, setConflict] = useState(false);
  const [blockErrors, setBlockErrors] = useState<Record<string, string>>({});
  // Bumped whenever server data replaces the form, so the canvas remounts on the new Body.
  const [bodyRevision, setBodyRevision] = useState(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const query = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticle(articleId as string),
    enabled: !!articleId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  function applyServer(article: Article) {
    const next = articleToForm(article);
    setServer(article);
    setForm(next);
    setBaseline(next);
    // A slug that no longer matches its title was edited by hand — stop auto-filling it.
    setSlugTouched(article.slug !== slugify(article.title));
    setFieldErrors({});
    setErrorBanner(null);
    setConflict(false);
    setBlockErrors({});
    setBodyRevision((r) => r + 1);
  }

  // First load: adopt the fetched Article (state adjusted during render, not in an effect).
  if (query.data && !server) applyServer(query.data);

  const slugLocked = isSlugLocked(server ?? undefined);

  function update<K extends keyof ArticleFormState>(key: K, value: ArticleFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    const field = key as ArticleMetadataField;
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: undefined }));
  }

  function setTitle(title: string) {
    update("title", title);
    if (!slugTouched && !slugLocked) update("slug", slugify(title));
  }

  function setSlug(slug: string) {
    if (slugLocked) return;
    setSlugTouched(true);
    update("slug", slug);
  }

  function syncServerCache(article: Article) {
    queryClient.setQueryData(["article", article.id], article);
    queryClient.invalidateQueries({ queryKey: ["articles"] });
  }

  function afterWrite(article: Article, sent: ArticleFormState) {
    setServer(article);
    setBaseline(sent);
    syncServerCache(article);
  }

  const saveMutation = useMutation({
    mutationFn: async (sent: ArticleFormState) => {
      let current = server;
      if (!current) {
        // POST can't carry a Thumbnail, so a new Article with one is created
        // first and then saved once more. The Article exists from here on even
        // if that follow-up PUT fails, so the next Save must PUT, not POST.
        const created: Article = { ...(await createArticle(toCreatePayload(sent))), was_published: false };
        afterWrite(created, { ...sent, thumbnail: null });
        setArticleId(created.id);
        // Only while still on the editor — the user may have left while the POST was in flight.
        if (mountedRef.current) window.history.replaceState(null, "", `/admin/articles/${created.id}`);
        if (!sent.thumbnail) return created;
        current = created;
      }
      return saveArticle(current.id, toSavePayload(sent, current.version));
    },
    onMutate: () => {
      setConflict(false);
      setFieldErrors({});
      setErrorBanner(null);
      setBlockErrors({});
    },
    onSuccess: (article, sent) => afterWrite(article, sent),
    onError: (err, sent) => {
      if (isVersionConflict(err)) {
        setConflict(true);
        return;
      }
      const fields = articleFieldErrors(err);
      setFieldErrors(fields);
      const body = articleBodyErrors(err, sent.body);
      setBlockErrors(body.blockErrors);
      const details = [...(Object.keys(body.blockErrors).length > 0 ? [BLOCKS_MARKED] : []), ...body.unresolved];
      if (Object.keys(fields).length === 0 || details.length > 0) {
        setErrorBanner({ message: err.message, details });
      }
    },
  });

  async function reloadLatest() {
    const { data } = await query.refetch();
    if (data) applyServer(data);
  }

  // Publish/Unpublish only flip status (+ published_at/version) — the form's own
  // fields are untouched, so unlike `afterWrite` the baseline never moves.
  function applyStatusChange(article: Article) {
    setServer(article);
    syncServerCache(article);
  }

  const publishMutation = useMutation({
    mutationFn: () => publishArticle((server as Article).id),
    onMutate: () => {
      setErrorBanner(null);
      setFieldErrors({});
    },
    onSuccess: applyStatusChange,
    onError: (err) => {
      // The same 422 `{ missing: [...] }` shape the Publish checklist mirrors client-side —
      // e.g. a race where another save cleared a required field moments earlier.
      setFieldErrors(articleFieldErrors(err));
      setErrorBanner({ message: err instanceof Error ? err.message : PUBLISH_FAILED, details: [] });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishArticle((server as Article).id),
    onMutate: () => {
      setErrorBanner(null);
      setFieldErrors({});
    },
    onSuccess: applyStatusChange,
    onError: (err) => {
      setErrorBanner({ message: err instanceof Error ? err.message : UNPUBLISH_FAILED, details: [] });
    },
  });

  // Mirrors the backend's own Publish-readiness rule, recomputed every render straight
  // from the live form — so the checklist and the Publish button stay in sync as-you-type.
  const publishIssues = getArticlePublishIssues({
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    thumbnail_url: form.thumbnail?.url ?? null,
    body: form.body,
  });

  const dirty = !formsEqual(form, baseline);

  return {
    articleId,
    article: server,
    isLoading: !!initialId && !server && query.isLoading,
    loadError: query.error,
    form,
    update,
    setTitle,
    setSlug,
    slugLocked,
    dirty,
    save: () => {
      if (saveMutation.isPending) return;
      // Client-side pre-flight the backend has no rule of its own for: an
      // image Block missing alt text is flagged (reusing the same
      // outline-and-message decoration a server Block error gets) and the
      // request is never sent.
      const altErrors = missingImageAltErrors(form.body);
      if (Object.keys(altErrors).length > 0) {
        setBlockErrors(altErrors);
        setErrorBanner({ message: BLOCKS_MARKED, details: [] });
        return;
      }
      saveMutation.mutate(form);
    },
    isSaving: saveMutation.isPending,
    setBody: (body: ArticleBlock[]) => update("body", body),
    bodyRevision,
    blockErrors,
    fieldErrors,
    errorBanner,
    conflict,
    reloadLatest,
    isReloading: query.isFetching,
    publishIssues,
    publish: () => publishMutation.mutate(),
    isPublishing: publishMutation.isPending,
    unpublish: () => unpublishMutation.mutate(),
    isUnpublishing: unpublishMutation.isPending,
  };
}

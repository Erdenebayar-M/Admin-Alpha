"use client";

import { useParams } from "next/navigation";
import { ArticleEditor } from "@/components/articles/ArticleEditor";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  // Keyed by id so moving between Articles never carries one's local edits into another.
  return <ArticleEditor key={id} articleId={id} />;
}

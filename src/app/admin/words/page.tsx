"use client";

import { WordsTab } from "@/components/admin/WordsTab";
import { PageHeader } from "@/components/ui/page-header";

export default function WordsPage() {
  return (
    <div>
      <PageHeader
        title="Үгийн сан"
        subtitle="Өгөгдлийн санд хадгалагдсан үгс"
      />
      <WordsTab />
    </div>
  );
}

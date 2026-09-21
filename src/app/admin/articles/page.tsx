"use client";

import { ArticlesTab } from "@/components/admin/ArticlesTab";
import { PageHeader } from "@/components/ui/page-header";

export default function ArticlesPage() {
  return (
    <div>
      <PageHeader
        title="Нийтлэл"
        subtitle="Сайтад нийтлэгдэх нийтлэлүүд"
      />
      <ArticlesTab />
    </div>
  );
}

"use client";

import { ReviewTab } from "@/components/admin/ReviewTab";
import { ConnectedStatusBar } from "@/components/admin/ConnectedStatusBar";
import { PageHeader } from "@/components/ui/page-header";

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Хяналтын дараалал"
        subtitle="AI болон гараар үүсгэсэн даалгаврыг хянаж батлана"
      />
      <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
        <ConnectedStatusBar />
      </div>
      <ReviewTab />
    </div>
  );
}

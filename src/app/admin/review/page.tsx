"use client";

import { ReviewTab } from "@/components/admin/ReviewTab";
import { ConnectedStatusBar } from "@/components/admin/ConnectedStatusBar";
import { ReviewDetailModal } from "@/components/modals/ReviewDetailModal";

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-0">
      <div className="sticky top-12 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3">
        <ConnectedStatusBar />
      </div>
      <ReviewTab />
      <ReviewDetailModal />
    </div>
  );
}

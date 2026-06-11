"use client";

import { useRouter } from "next/navigation";
import { GeneratePanel } from "@/components/modals/GenerateModal";
import { PageHeader } from "@/components/ui/page-header";

export default function GenerateTaskPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Даалгаврууд", href: "/admin/tasks" },
          { label: "AI-аар үүсгэх" },
        ]}
        title="AI-аар даалгавар үүсгэх"
        actions={
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            ← Буцах
          </button>
        }
      />
      <div className="px-4 py-6 sm:px-6">
        <GeneratePanel />
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { CreateTaskPanel } from "@/components/modals/CreateTaskModal";

export default function CreateTaskPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl px-0">
      <div className="sticky top-12 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.push('/admin/tasks')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Буцах
          </button>
          <span className="text-sm font-semibold">Даалгавар гараар нэмэх</span>
        </div>
      </div>
      <div className="px-4 py-6">
        <CreateTaskPanel onClose={() => router.push('/admin/tasks')} />
      </div>
    </div>
  );
}

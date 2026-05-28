"use client";

import { TasksTab } from "@/components/admin/TasksTab";
import { ConnectedStatusBar } from "@/components/admin/ConnectedStatusBar";
import { TaskDetailModal } from "@/components/modals/TaskDetailModal";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-5xl px-0">
      <div className="sticky top-12 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3">
        <ConnectedStatusBar />
      </div>
      <TasksTab />
      <TaskDetailModal />
    </div>
  );
}

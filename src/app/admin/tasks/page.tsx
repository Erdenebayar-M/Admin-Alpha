"use client";

import { TasksTab } from "@/components/admin/TasksTab";
import { ConnectedStatusBar } from "@/components/admin/ConnectedStatusBar";
import { PageHeader } from "@/components/ui/page-header";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Даалгаврууд"
        subtitle="Батлагдсан даалгаврын жагсаалт"
      />
      <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
        <ConnectedStatusBar />
      </div>
      <TasksTab />
    </div>
  );
}

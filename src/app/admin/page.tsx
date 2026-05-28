"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ReviewTab } from "@/components/admin/ReviewTab";
import { TasksTab } from "@/components/admin/TasksTab";
import { ReviewDetailModal } from "@/components/modals/ReviewDetailModal";
import { GenerateModal } from "@/components/modals/GenerateModal";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";

type MainTab = "review" | "tasks";

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "review", label: "Хяналт" },
  { id: "tasks", label: "Даалгаврууд" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("review");

  return (
    <div className="mx-auto max-w-5xl px-0">
      {/* Tab bar */}
      <div className="sticky top-12 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4">
        <div className="flex gap-1">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "-mb-px border-b-2 px-5 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "review" ? <ReviewTab /> : <TasksTab />}
      </div>

      {/* Modals — always mounted */}
      <ReviewDetailModal />
      <GenerateModal />
      <CreateTaskModal />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { CreateTaskPanel } from "@/components/modals/CreateTaskModal";
import { PageHeader } from "@/components/ui/page-header";

export default function CreateTaskPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumbs={[
          { label: "Даалгаврууд", href: "/admin/tasks" },
          { label: "Шинэ даалгавар" },
        ]}
        title="Гараар даалгавар нэмэх"
      />
      <div className="px-4 py-6 sm:px-6">
        <CreateTaskPanel onClose={() => router.push('/admin/tasks')} />
      </div>
    </div>
  );
}

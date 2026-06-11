export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border">
      <p className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-bold text-foreground">
        {title}
      </p>
      <div className="space-y-4 px-4 py-4">
        {children}
      </div>
    </div>
  );
}

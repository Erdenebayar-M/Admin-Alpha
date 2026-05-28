export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      <div className="mb-6 h-6 w-40 rounded bg-muted" />
      <div className="mb-4 flex gap-2">
        <div className="h-8 w-24 rounded-md bg-muted" />
        <div className="h-8 w-24 rounded-md bg-muted" />
        <div className="h-8 w-24 rounded-md bg-muted" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-border bg-muted" />
        ))}
      </div>
    </div>
  );
}

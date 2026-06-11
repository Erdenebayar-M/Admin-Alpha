export function DifficultyDots({ n }: { n: number }) {
  const clamped = Math.round(Math.max(0, Math.min(5, n)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const pos = i + 1;
        const filled = pos <= clamped;
        const opacity = filled ? 0.22 + (pos / 5) * 0.78 : 0.09;
        return (
          <span
            key={i}
            className="block h-2.5 w-2.5 rounded-full bg-blue-950 dark:bg-blue-200"
            style={{ opacity }}
          />
        );
      })}
    </div>
  );
}

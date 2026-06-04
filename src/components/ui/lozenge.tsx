import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";

const lozengeVariants = cva(
  "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide leading-none select-none",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        info:    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
        success: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
        danger:  "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

interface LozengeProps extends VariantProps<typeof lozengeVariants> {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
}

export function Lozenge({ children, tone, className }: LozengeProps) {
  return (
    <span className={cn(lozengeVariants({ tone }), className)}>
      {children}
    </span>
  );
}

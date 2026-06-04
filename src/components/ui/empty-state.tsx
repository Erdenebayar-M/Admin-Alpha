import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  subMessage?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, message, subMessage, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">{message}</p>
        {subMessage && <p className="mt-1 text-xs text-muted-foreground">{subMessage}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

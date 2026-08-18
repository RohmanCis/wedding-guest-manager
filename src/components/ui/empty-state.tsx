import { Users, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  variant = "empty",
  title,
  description,
  action,
  className
}: {
  variant?: "empty" | "no-results";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const Icon = variant === "no-results" ? SearchX : Users;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-default px-6 py-14 text-center",
        className
      )}
    >
      <Icon className="size-10 text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-secondary">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

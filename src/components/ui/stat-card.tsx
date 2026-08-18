import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  accent,
  className
}: {
  label: string;
  value: number | string;
  /** 3px left accent bar: bg class, e.g. colorFor().dot */
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative min-h-[80px] overflow-hidden rounded-xl border border-subtle bg-surface-3 p-4 shadow-1 transition-shadow duration-200 hover:shadow-2",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          accent ?? "bg-[var(--border-strong)]"
        )}
      />
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-accent-cream">
        {value}
      </div>
    </div>
  );
}

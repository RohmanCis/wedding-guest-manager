import { cn } from "@/lib/utils";
import { colorFor, colorForGroup } from "@/lib/party-colors";

type Kind = "party" | "group";

export function CategoryDot({
  kind,
  name,
  className
}: {
  kind: Kind;
  name: string;
  className?: string;
}) {
  if (kind === "group") {
    return (
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", className)}
        style={{ backgroundColor: colorForGroup(name).dot }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn("size-2 shrink-0 rounded-full", colorFor(kind, name).dot, className)}
    />
  );
}

export function CategoryBadge({
  kind,
  name,
  className
}: {
  kind: Kind;
  name: string;
  className?: string;
}) {
  const c = colorFor(kind, name);
  const g = kind === "group" ? colorForGroup(name) : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium transition-colors duration-200",
        kind === "party" && cn(c.bg, c.text),
        className
      )}
      style={g ? { backgroundColor: g.bg, color: g.text } : undefined}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", kind === "party" && c.dot)}
        style={g ? { backgroundColor: g.dot } : undefined}
      />
      {name}
    </span>
  );
}

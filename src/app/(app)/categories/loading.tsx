import { TopBar } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";

const SECTIONS = [0, 1];
const ROWS = [0, 1, 2, 3];

/** Skeleton bar with the shimmer zeroed for reduced-motion users. */
function Bar({ className }: { className: string }) {
  return (
    <Skeleton className={`motion-reduce:before:animate-none ${className}`} />
  );
}

function CategorySectionSkeleton() {
  return (
    <Card variant="flat" className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <Bar className="h-5 w-16" />
        <Bar className="h-5 w-6 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Bar className="h-9 flex-1 rounded-lg" />
          <Button
            tabIndex={-1}
            size="sm"
            className="pointer-events-none"
            aria-hidden="true"
          >
            Tambah
          </Button>
        </div>

        <div aria-hidden="true" className="border-t border-subtle" />

        <ul className="space-y-1">
          {ROWS.map((row) => (
            <li key={row} className="flex items-center gap-2 px-2 py-1.5">
              <span className="flex flex-1 items-center gap-2">
                <Skeleton className="size-2 rounded-full motion-reduce:before:animate-none" />
                <Bar className="h-4 w-24" />
              </span>
              <Bar className="h-5 w-14 rounded-full" />
              <Bar className="h-7 w-7" />
              <Bar className="h-7 w-7" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function CategoriesLoading() {
  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Kategori</h1>
      </TopBar>

      <main className="space-y-5 p-6">
        <div aria-busy="true" className="space-y-5">
          <p role="status" className="sr-only">
            Memuat kategori
          </p>

          <div
            aria-hidden="true"
            className="grid items-start gap-6 lg:grid-cols-2"
          >
            {SECTIONS.map((section) => (
              <CategorySectionSkeleton key={section} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

import { TopBar } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";

const SECTIONS = [0, 1, 2];
const ROWS = [0, 1, 2, 3];

/** Skeleton bar with the shimmer zeroed for reduced-motion users. */
function Bar({ className }: { className: string }) {
  return (
    <Skeleton className={`motion-reduce:before:animate-none ${className}`} />
  );
}

export default function DaftarLoading() {
  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Daftar</h1>
        <div className="flex items-center gap-2" aria-hidden="true">
          <Button
            variant="secondary"
            size="sm"
            tabIndex={-1}
            className="pointer-events-none"
          >
            Per Pihak
          </Button>
          <Button
            variant="ghost"
            size="sm"
            tabIndex={-1}
            className="pointer-events-none"
          >
            Per Grup
          </Button>
        </div>
      </TopBar>
      <main className="space-y-5 p-6">
        <div aria-busy="true" className="space-y-5">
          <p role="status" className="sr-only">
            Memuat daftar tamu
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Bar className="h-9 w-full rounded-lg sm:w-56" />
            <Bar className="h-9 w-full rounded-lg sm:w-44" />
            <Bar className="h-9 w-full rounded-lg sm:w-44" />
          </div>

          <Bar className="h-5 w-32" />

          <div aria-hidden="true" className="space-y-5">
            {SECTIONS.map((section) => (
              <section key={section}>
                <div className="sticky top-12 z-[5] flex h-10 items-center justify-between gap-2 border-b border-default bg-surface-1 px-3">
                  <span className="flex items-center gap-1.5">
                    <Skeleton className="size-2 rounded-full motion-reduce:before:animate-none" />
                    <Bar className="h-3.5 w-24" />
                  </span>
                  <Bar className="h-3 w-12" />
                </div>
                <ul className="border-b border-subtle last:border-b-0">
                  {ROWS.map((row) => (
                    <li
                      key={row}
                      className="flex items-center justify-between gap-3 border-b border-subtle px-3 py-2.5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <Bar className="h-5 w-40" />
                        <Bar className="h-4 w-56" />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

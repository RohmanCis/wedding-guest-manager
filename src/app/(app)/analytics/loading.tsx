import { TopBar } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";

const BARS = [0, 1, 2, 3, 4, 5];

/** Skeleton bar with the shimmer zeroed for reduced-motion users. */
function Bar({ className }: { className: string }) {
  return (
    <Skeleton className={`motion-reduce:before:animate-none ${className}`} />
  );
}

export default function AnalyticsLoading() {
  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Analitik</h1>
      </TopBar>

      <main className="p-6">
        <div aria-busy="true" className="space-y-5">
          <p role="status" className="sr-only">
            Memuat analitik
          </p>

          <div
            aria-hidden="true"
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            <Card variant="flat" className="p-4 lg:col-span-1">
              <div className="space-y-4">
                <Bar className="h-9 w-full rounded-lg" />
                <Bar className="h-9 w-full rounded-lg" />
                <Bar className="h-9 w-full rounded-lg" />
                <Bar className="h-4 w-32" />
              </div>
            </Card>

            <Card
              variant="elevated"
              className="min-h-[320px] p-4 lg:col-span-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Bar className="h-5 w-36" />
                <div className="flex items-center gap-2">
                  <Bar className="h-8 w-20 rounded-lg" />
                  <Bar className="h-8 w-20 rounded-lg" />
                </div>
              </div>

              <ul className="mt-4 max-h-[480px] space-y-3 overflow-y-auto">
                {BARS.map((bar) => (
                  <li key={bar}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <Bar className="h-4 w-28" />
                      <Bar className="h-4 w-10" />
                    </div>
                    <Bar className="h-2.5 w-full rounded-full" />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

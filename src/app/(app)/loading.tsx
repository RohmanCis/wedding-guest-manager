import { TopBar } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";

const STATS = [0, 1, 2, 3, 4];
const ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

/** Skeleton bar with the shimmer zeroed for reduced-motion users. */
function Bar({ className }: { className: string }) {
  return (
    <Skeleton className={`motion-reduce:before:animate-none ${className}`} />
  );
}

export default function DashboardLoading() {
  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Tamu</h1>
        <div
          className="hidden items-center gap-2 sm:flex"
          aria-hidden="true"
        >
          <Button
            variant="secondary"
            size="sm"
            tabIndex={-1}
            className="pointer-events-none"
          >
            Export
          </Button>
          <Button size="sm" tabIndex={-1} className="pointer-events-none">
            Tambah Tamu
          </Button>
        </div>
      </TopBar>

      <main className="space-y-5 p-6 pb-24 sm:pb-6">
        <div aria-busy="true" className="space-y-5">
          <p role="status" className="sr-only">
            Memuat tamu
          </p>

          <section
            aria-hidden="true"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          >
            {STATS.map((stat) => (
              <div
                key={stat}
                className={`min-h-[80px] rounded-xl border border-subtle bg-surface-3 p-4 ${
                  stat < 2 ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <Bar className="h-3 w-16" />
                <Bar className="mt-2 h-6 w-10" />
              </div>
            ))}
          </section>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Bar className="h-9 w-full rounded-lg sm:w-56" />
            <Bar className="h-9 w-full rounded-lg sm:w-44" />
            <Bar className="h-9 w-full rounded-lg sm:w-44" />
          </div>

          <Bar className="h-3 w-40" />

          <div aria-hidden="true">
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableHead className="w-10">
                      <Bar className="h-3 w-4" />
                    </TableHead>
                    <TableHead>
                      <Bar className="h-3 w-12" />
                    </TableHead>
                    <TableHead>
                      <Bar className="h-3 w-8" />
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <Bar className="h-3 w-14" />
                    </TableHead>
                    <TableHead>
                      <Bar className="h-3 w-10" />
                    </TableHead>
                    <TableHead>
                      <Bar className="h-3 w-10" />
                    </TableHead>
                    <TableHead className="w-px">
                      <Bar className="h-3 w-6" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROWS.map((row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <Bar className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Bar className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Bar className="h-4 w-6" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Bar className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Bar className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Bar className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Bar className="h-7 w-7" />
                          <Bar className="h-7 w-7" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((page) => (
                  <Bar key={page} className="h-8 w-8 rounded-lg" />
                ))}
              </div>
              <Bar className="h-8 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

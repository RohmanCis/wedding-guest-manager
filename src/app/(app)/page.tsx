import { listGuests } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";
import GuestsView from "./guests-view";

export const dynamic = "force-dynamic";

// Sequential awaits: postgres.js max:1 pool stalls when list queries
// (which fan out refCount sub-queries) run concurrently via Promise.all.
export default async function Page() {
  const initialGuests = await listGuests();
  const initialParties = await parties.list();
  const initialGroups = await groups.list();
  return (
    <GuestsView
      initialGuests={initialGuests}
      initialParties={initialParties}
      initialGroups={initialGroups}
    />
  );
}
import { listGuests } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";
import DaftarView from "./daftar-view";

export const dynamic = "force-dynamic";

// Sequential awaits: postgres.js max:1 pool stalls under concurrent queries.
export default async function Page() {
  const initialGuests = await listGuests();
  const initialParties = await parties.list();
  const initialGroups = await groups.list();
  return (
    <DaftarView
      initialGuests={initialGuests}
      initialParties={initialParties}
      initialGroups={initialGroups}
    />
  );
}

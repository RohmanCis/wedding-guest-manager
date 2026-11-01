import { listGuests } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";
import DaftarView from "./daftar-view";

export const dynamic = "force-dynamic";

// Sequential awaits: postgres.js max:1 pool stalls under concurrent queries.
export default async function Page() {
  const initialGuests = await listGuests();
  const initialParties = await parties.list();
  const initialGroups = await groups.list();
  // Project to the fields this page renders; server-only columns stay out of RSC props.
  const guests = initialGuests.map(
    ({ id, name, address, pax, party_name, group_name }) => ({
      id,
      name,
      address,
      pax,
      party_name,
      group_name
    })
  );
  return (
    <DaftarView
      initialGuests={guests}
      initialParties={initialParties}
      initialGroups={initialGroups}
    />
  );
}

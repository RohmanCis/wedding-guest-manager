import { listGuests } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";
import GuestsView from "./guests-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [initialGuests, initialParties, initialGroups] = await Promise.all([
    listGuests(),
    parties.list(),
    groups.list()
  ]);
  return (
    <GuestsView
      initialGuests={initialGuests}
      initialParties={initialParties}
      initialGroups={initialGroups}
    />
  );
}

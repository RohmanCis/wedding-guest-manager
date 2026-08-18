import { parties, groups } from "@/lib/categories";
import CategoriesView from "./categories-view";

export const dynamic = "force-dynamic";

// Sequential awaits: postgres.js max:1 pool stalls under concurrent queries.
export default async function Page() {
  const initialParties = await parties.list();
  const initialGroups = await groups.list();
  return (
    <CategoriesView
      initialParties={initialParties}
      initialGroups={initialGroups}
    />
  );
}

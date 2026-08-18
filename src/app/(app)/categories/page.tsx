import { parties, groups } from "@/lib/categories";
import CategoriesView from "./categories-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [initialParties, initialGroups] = await Promise.all([
    parties.list(),
    groups.list()
  ]);
  return (
    <CategoriesView
      initialParties={initialParties}
      initialGroups={initialGroups}
    />
  );
}

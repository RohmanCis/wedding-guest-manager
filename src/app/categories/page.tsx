"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/loading";
import { CategoryDot } from "@/components/ui/category-badge";
import { TopBar } from "@/components/app-shell";
import { motion } from "motion/react";
import { getVariants } from "@/lib/animation-variants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Check, X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Cat extends Ref {
  used?: number;
}
interface Ref {
  id: string;
  name: string;
}

type Kind = "party" | "group";

export default function CategoriesPage() {
  const [parties, setParties] = useState<Cat[]>([]);
  const [groups, setGroups] = useState<Cat[]>([]);
  const [newParty, setNewParty] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet<{ parties: Cat[]; groups: Cat[] }>(
        "/api/categories"
      );
      setParties(data.parties);
      setGroups(data.groups);
    } catch (e: any) {
      setError(e.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add(kind: Kind, name: string) {
    setError("");
    setPending(`add-${kind}`);
    try {
      await apiSend("/api/categories", "POST", { type: kind, name });
      setNewParty("");
      setNewGroup("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(null);
    }
  }

  async function rename(kind: Kind, id: string, name: string) {
    setError("");
    setPending(`rename-${id}`);
    try {
      await apiSend("/api/categories", "PUT", { type: kind, id, name });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(null);
    }
  }

  async function remove(kind: Kind, id: string) {
    setError("");
    setPending(`remove-${id}`);
    try {
      await apiSend("/api/categories", "DELETE", { type: kind, id });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Kategori</h1>
      </TopBar>
      <motion.main
        variants={getVariants(!!reducedMotion)}
        initial="initial"
        animate="animate"
        className="space-y-5 p-6"
      >
        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <Card key={i} variant="flat" className="p-4">
                <div role="status" aria-label="Loading categories">
                  <span className="sr-only">Loading…</span>
                  <Skeleton className="mb-4 h-6 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <CategorySection
              title="Party"
              items={parties}
              value={newParty}
              setValue={setNewParty}
              onAdd={() => add("party", newParty)}
              onRename={rename}
              onRemove={remove}
              kind="party"
              pending={pending}
            />
            <CategorySection
              title="Group"
              items={groups}
              value={newGroup}
              setValue={setNewGroup}
              onAdd={() => add("group", newGroup)}
              onRename={rename}
              onRemove={remove}
              kind="group"
              pending={pending}
            />
          </div>
        )}
      </motion.main>
    </>
  );
}

function CategorySection({
  title,
  items,
  value,
  setValue,
  onAdd,
  onRename,
  onRemove,
  kind,
  pending
}: {
  title: string;
  items: Cat[];
  value: string;
  setValue: (v: string) => void;
  onAdd: () => void;
  onRename: (k: Kind, id: string, name: string) => void;
  onRemove: (k: Kind, id: string) => void;
  kind: Kind;
  pending: string | null;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const singular = kind;
  const inputId = `new-${kind}`;

  return (
    <Card variant="flat" className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <span className="rounded-full border border-subtle bg-surface-4 px-2 py-0.5 text-xs font-medium text-secondary tabular-nums">
          {items.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onAdd();
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            New {singular}
          </label>
          <Input
            id={inputId}
            className="flex-1"
            placeholder={`New ${singular}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button type="submit" size="sm" loading={pending === `add-${kind}`}>
            Tambah
          </Button>
        </form>

        <div aria-hidden="true" className="border-t border-subtle" />

        {items.length === 0 ? (
          <EmptyState
            variant="empty"
            title={`No ${title.toLowerCase()} yet`}
            description={`Add the first ${singular} above.`}
            className="py-10"
          />
        ) : (
          <ul className="space-y-1">
            {items.map((item) => {
              const used = item.used ?? 0;
              const isEditing = editing === item.id;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                    !isEditing && "hover:bg-surface-4"
                  )}
                >
                  {isEditing ? (
                    <form
                      className="flex flex-1 items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        onRename(kind, item.id, editName);
                        setEditing(null);
                      }}
                    >
                      <label
                        htmlFor={`rename-${item.id}`}
                        className="sr-only"
                      >
                        Rename {item.name}
                      </label>
                      <Input
                        id={`rename-${item.id}`}
                        className="h-8 flex-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <Button
                        type="submit"
                        size="sm"
                        loading={pending === `rename-${item.id}`}
                      >
                        <Check aria-hidden="true" />
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(null)}
                      >
                        <X aria-hidden="true" />
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <>
                      <span className="flex flex-1 items-center gap-2 truncate text-sm font-medium text-primary">
                        <CategoryDot kind={kind} name={item.name} />
                        {item.name}
                      </span>
                      <span className="rounded-full border border-subtle bg-surface-4 px-2 py-0.5 text-xs text-secondary tabular-nums">
                        {used} {used === 1 ? "guest" : "guests"}
                      </span>
                      <span className="flex gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Rename ${item.name}`}
                          onClick={() => {
                            setEditing(item.id);
                            setEditName(item.name);
                          }}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${item.name}`}
                          className="text-danger hover:bg-danger-subtle hover:text-danger"
                          loading={pending === `remove-${item.id}`}
                          disabled={used > 0}
                          title={
                            used > 0
                              ? "Reassign guests before deleting"
                              : "Delete"
                          }
                          onClick={() => onRemove(kind, item.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

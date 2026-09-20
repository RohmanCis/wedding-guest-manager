"use client";

import { useEffect, useRef, type RefObject } from "react";

/** The subset of a KeyboardEvent the predicate reads (DOM-free, testable). */
export type ShortcutEvent = Pick<
  KeyboardEvent,
  | "key"
  | "ctrlKey"
  | "metaKey"
  | "altKey"
  | "shiftKey"
  | "repeat"
  | "isComposing"
  | "target"
>;

/** Text fields / Radix portal surfaces that own Enter for themselves. */
const BLOCKED_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="listbox"]';

/**
 * Ctrl/Cmd+Enter opens "Tambah Tamu" — desktop accelerator (option C).
 * Pure decision core so the rules are unit-testable in the node env.
 * Shift is intentionally allowed (Ctrl+Shift+Enter triggers); Alt is
 * rejected because AltGr reports ctrl+alt on several layouts.
 */
export function shouldTriggerShortcut(
  e: ShortcutEvent,
  flags: { dialogOpen: boolean; searchInput?: Element | null }
): boolean {
  if (!((e.ctrlKey || e.metaKey) && !e.altKey)) return false;
  if (e.key !== "Enter") return false;
  if (e.repeat || e.isComposing) return false;
  if (flags.dialogOpen) return false;

  const t = e.target as (EventTarget & { closest?: unknown }) | null;
  // Defensive: a target without closest() (synthetic/plain object) is allowed.
  if (t == null || typeof t.closest !== "function") return true;

  // Product decision: the shortcut still works while focus is in the search box.
  const search = flags.searchInput;
  if (search && (t === search || search.contains(t as Node))) return true;

  return (t as Element).closest(BLOCKED_SELECTOR) === null;
}

/**
 * Attaches ONE window keydown listener for the accelerator. Latest callback
 * and flag values are read through refs so the listener never goes stale.
 */
export function useAddGuestShortcut(
  onTrigger: () => void,
  opts: { dialogOpen: boolean; searchInput?: RefObject<HTMLElement | null> }
): void {
  const onTriggerRef = useRef(onTrigger);
  const dialogOpenRef = useRef(opts.dialogOpen);
  const searchInputRef = useRef(opts.searchInput);
  onTriggerRef.current = onTrigger;
  dialogOpenRef.current = opts.dialogOpen;
  searchInputRef.current = opts.searchInput;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const triggered = shouldTriggerShortcut(e, {
        dialogOpen: dialogOpenRef.current,
        // Read .current at event time, not effect-mount time.
        searchInput: searchInputRef.current?.current ?? null
      });
      if (!triggered) return;
      e.preventDefault();
      onTriggerRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

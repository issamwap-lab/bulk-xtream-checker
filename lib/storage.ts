import { EntryRow } from "@/lib/types";

export const ACTIVE_STORAGE_KEY = "xtream-datashow-active-apis";

export type StoredEntry = EntryRow & {
  rawLine: string;
};

export function entryKey(entry: Pick<EntryRow, "protocol" | "host" | "port" | "username" | "password">): string {
  return `${entry.protocol}://${entry.host}:${entry.port}|${entry.username}|${entry.password}`;
}

export function isActiveEntry(entry: EntryRow): boolean {
  if (entry.status !== "valid") {
    return false;
  }

  const accountStatus = entry.accountStatus?.trim().toLowerCase();
  if (accountStatus && accountStatus !== "active") {
    return false;
  }

  return entry.isUnlimited || entry.daysRemaining >= 0;
}

export function loadActiveEntries(): StoredEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as StoredEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isActiveEntry);
  } catch {
    return [];
  }
}

export function saveActiveEntries(entries: StoredEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const activeOnly = entries.filter(isActiveEntry);
  window.localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(activeOnly));
}

export function mergeActiveEntries(existing: StoredEntry[], incoming: StoredEntry[]): StoredEntry[] {
  const map = new Map<string, StoredEntry>();

  for (const entry of existing) {
    if (isActiveEntry(entry)) {
      map.set(entryKey(entry), entry);
    }
  }

  for (const entry of incoming) {
    const key = entryKey(entry);
    if (isActiveEntry(entry)) {
      map.set(key, entry);
    } else {
      map.delete(key);
    }
  }

  return Array.from(map.values());
}

export function clearActiveEntries(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_STORAGE_KEY);
}

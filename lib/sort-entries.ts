import { EntryRow } from "@/lib/types";
import { formatHostWithPort } from "@/lib/format-host";

export type SortColumn =
  | "host"
  | "username"
  | "password"
  | "expiryISO"
  | "status"
  | "timezone"
  | "maxConnections";

export type SortDirection = "asc" | "desc";

function statusRank(entry: EntryRow): number {
  if (entry.status === "valid") {
    return 0;
  }
  if (entry.status === "expired") {
    return 1;
  }
  return 2;
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

function compareNumbers(a: number, b: number): number {
  return a - b;
}

function getSortValue(entry: EntryRow, column: SortColumn): string | number {
  switch (column) {
    case "host":
      return formatHostWithPort(entry);
    case "username":
      return entry.username;
    case "password":
      return entry.password;
    case "expiryISO":
      if (entry.isUnlimited) {
        return Number.MAX_SAFE_INTEGER;
      }
      return entry.expiryISO ? new Date(entry.expiryISO).getTime() : 0;
    case "status":
      return entry.isUnlimited ? Number.MAX_SAFE_INTEGER : entry.daysRemaining;
    case "timezone":
      return entry.timezone ?? "";
    case "maxConnections":
      return entry.maxConnections ?? -1;
  }
}

export function sortEntries<T extends EntryRow>(
  entries: T[],
  column: SortColumn | null,
  direction: SortDirection
): T[] {
  const sorted = [...entries];

  if (!column) {
    return sorted.sort((a, b) => {
      const rankDiff = statusRank(a) - statusRank(b);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      const aDays = a.isUnlimited ? Number.MAX_SAFE_INTEGER : a.daysRemaining;
      const bDays = b.isUnlimited ? Number.MAX_SAFE_INTEGER : b.daysRemaining;
      return bDays - aDays;
    });
  }

  sorted.sort((a, b) => {
    const aValue = getSortValue(a, column);
    const bValue = getSortValue(b, column);
    const base =
      typeof aValue === "number" && typeof bValue === "number"
        ? compareNumbers(aValue, bValue)
        : compareStrings(String(aValue), String(bValue));

    return direction === "asc" ? base : -base;
  });

  return sorted;
}

export function nextSortDirection(current: SortDirection | null): SortDirection {
  return current === "asc" ? "desc" : "asc";
}

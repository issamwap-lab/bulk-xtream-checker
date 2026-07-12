"use client";

import { useMemo } from "react";
import { CheckLineResult } from "@/lib/types";
import { formatExpiryDate, getStatusChipStyle } from "@/lib/status";
import { formatHostWithPort } from "@/lib/format-host";
import { LIFETIME_DAYS_SENTINEL } from "@/lib/config";
import { nextSortDirection, sortEntries, SortColumn, SortDirection } from "@/lib/sort-entries";
import { StoredEntry } from "@/lib/storage";

const SORTABLE_COLUMNS: { key: SortColumn; label: string }[] = [
  { key: "host", label: "Host" },
  { key: "username", label: "Username" },
  { key: "password", label: "Password" },
  { key: "expiryISO", label: "Expiry date" },
  { key: "status", label: "Status" },
  { key: "timezone", label: "Timezone" },
  { key: "maxConnections", label: "Max cnx" }
];

function statusLabel(entry: StoredEntry): string {
  const accountStatus = entry.accountStatus?.trim() || "Active";
  if (entry.isUnlimited) {
    return `${accountStatus} \u00b7 Lifetime`;
  }
  const daysText =
    entry.daysRemaining === 1 ? "1 day left" : `${entry.daysRemaining} days left`;
  return `${accountStatus} \u00b7 ${daysText}`;
}

function SortHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort
}: {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn | null;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
}) {
  const isActive = activeColumn === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="group inline-flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-900"
    >
      <span>{label}</span>
      <span
        className={`text-[10px] ${
          isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
        }`}
      >
        {isActive ? (direction === "asc" ? "A\u2192Z" : "Z\u2192A") : "\u2195"}
      </span>
    </button>
  );
}

type ResultsTableProps = {
  entries: StoredEntry[];
  checking: boolean;
  progress: { done: number; total: number };
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
};

export function ResultsTable({
  entries,
  checking,
  progress,
  sortColumn,
  sortDirection,
  onSort
}: ResultsTableProps) {
  const sortedEntries = useMemo(() => {
    return sortEntries(entries, sortColumn, sortDirection);
  }, [entries, sortColumn, sortDirection]);

  return (
    <section className="inline-block max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
      {entries.length === 0 && !checking ? (
        <p className="p-6 text-sm text-slate-600">
          No active APIs yet. Paste lines above and click Check.
        </p>
      ) : null}

      {entries.length > 0 || checking ? (
        <table className="w-max min-w-full table-auto border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs">
              <th className="whitespace-nowrap px-3 py-3 font-semibold text-slate-500">
                #
              </th>
              {SORTABLE_COLUMNS.map(({ key, label }) => (
                <th key={key} className="whitespace-nowrap px-3 py-3">
                  <SortHeader
                    label={label}
                    column={key}
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={onSort}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry, rowIndex) => {
              const chipStyle = getStatusChipStyle(
                entry.isUnlimited ? LIFETIME_DAYS_SENTINEL : entry.daysRemaining,
                entry.status
              );
              const hostDisplay = formatHostWithPort(entry);

              return (
                <tr
                  key={entry.id}
                  className="animate-[fadeIn_0.35s_ease-out] border-t border-slate-100 text-slate-700"
                >
                  <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                    {rowIndex + 1}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900">
                    {hostDisplay}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{entry.username}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono">
                    {entry.password}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {entry.isUnlimited
                      ? "Lifetime"
                      : formatExpiryDate(entry.expiryISO)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span
                      className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
                      style={chipStyle}
                    >
                      {statusLabel(entry)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {entry.timezone ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {entry.maxConnections ?? "-"}
                  </td>
                </tr>
              );
            })}

            {checking ? (
              <tr className="border-t border-slate-100 text-slate-500">
                <td className="whitespace-nowrap px-3 py-3" colSpan={8}>
                  Checking {progress.done}/{progress.total}...
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}

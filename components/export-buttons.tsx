"use client";

import { StoredEntry } from "@/lib/storage";

function toCsv(entries: StoredEntry[]): string {
  const headers = [
    "Host",
    "Username",
    "Password",
    "Expiry",
    "Days Remaining",
    "Unlimited",
    "Status",
    "Account Status",
    "Timezone",
    "Max Connections",
    "Protocol"
  ];
  const rows = entries.map((e) => [
    `${e.protocol}://${e.host}:${e.port}`,
    e.username,
    e.password,
    e.expiryISO || "",
    String(e.daysRemaining),
    e.isUnlimited ? "Yes" : "No",
    e.status,
    e.accountStatus || "",
    e.timezone || "",
    e.maxConnections != null ? String(e.maxConnections) : "",
    e.protocol
  ]);

  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function toJson(entries: StoredEntry[]): string {
  return JSON.stringify(
    entries.map((e) => ({
      host: `${e.protocol}://${e.host}:${e.port}`,
      username: e.username,
      password: e.password,
      expiryISO: e.expiryISO || null,
      daysRemaining: e.daysRemaining,
      isUnlimited: e.isUnlimited,
      status: e.status,
      accountStatus: e.accountStatus,
      timezone: e.timezone,
      maxConnections: e.maxConnections
    })),
    null,
    2
  );
}

function download(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type ExportButtonsProps = {
  entries: StoredEntry[];
  disabled: boolean;
};

export function ExportButtons({ entries, disabled }: ExportButtonsProps) {
  if (entries.length === 0) return null;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => download(toCsv(entries), "xtream-apis.csv", "text/csv")}
        disabled={disabled}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => download(toJson(entries), "xtream-apis.json", "application/json")}
        disabled={disabled}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        Export JSON
      </button>
    </div>
  );
}

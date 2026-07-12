import { EntryStatus } from "@/lib/types";

export function getDaysRemaining(expiryISO: string): number {
  const now = new Date();
  const expiry = new Date(expiryISO);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getEntryStatus(daysRemaining: number): EntryStatus {
  return daysRemaining < 0 ? "expired" : "valid";
}

export function formatExpiryDate(expiryISO: string): string {
  if (!expiryISO) {
    return "-";
  }
  const date = new Date(expiryISO);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);
}

export function getStatusChipStyle(
  daysRemaining: number,
  status?: "valid" | "expired" | "error" | "invalid"
): { background: string; color: string; borderColor: string } {
  if (status === "error" || status === "invalid") {
    return {
      background: "rgba(148, 163, 184, 0.2)",
      color: "rgb(71, 85, 105)",
      borderColor: "rgba(148, 163, 184, 0.45)"
    };
  }

  if (daysRemaining < 0) {
    return {
      background: "rgba(239, 68, 68, 0.14)",
      color: "rgb(185, 28, 28)",
      borderColor: "rgba(239, 68, 68, 0.4)"
    };
  }

  const maxRange = 30;
  const ratio = Math.max(0, Math.min(daysRemaining / maxRange, 1));
  const hue = 55 + ratio * 65;
  const background = `hsla(${hue}, 90%, 55%, 0.18)`;
  const color = `hsl(${hue}, 88%, 28%)`;
  const borderColor = `hsla(${hue}, 85%, 40%, 0.42)`;

  return { background, color, borderColor };
}

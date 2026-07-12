import { EntryRow } from "@/lib/types";

export function formatHostWithPort(entry: Pick<EntryRow, "protocol" | "host" | "port">): string {
  return `${entry.protocol}://${entry.host}:${entry.port}`;
}

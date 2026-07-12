import { AccountDetails, ParsedCredential } from "@/lib/types";
import { LINE_CHECK_TIMEOUT_MS } from "@/lib/config";

export type PlayerApiResponse = {
  user_info?: {
    status?: string;
    exp_date?: string;
    timezone?: string;
    max_connections?: string;
  };
  server_info?: {
    timezone?: string;
  };
};

function toNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function toIsoFromUnix(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const unix = Number(value);
  if (!Number.isFinite(unix) || unix === 0) {
    return null;
  }
  return new Date(unix * 1000).toISOString();
}

export async function fetchPlayerApi(
  credential: Pick<ParsedCredential, "apiUrl">,
  timeoutMs = LINE_CHECK_TIMEOUT_MS
): Promise<PlayerApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(credential.apiUrl, {
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Provider responded with HTTP ${response.status}`);
    }

    return (await response.json()) as PlayerApiResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function mapPlayerApiToDetails(
  body: PlayerApiResponse,
  credential: Pick<ParsedCredential, "host" | "username">
): AccountDetails {
  return {
    host: credential.host,
    username: credential.username,
    status: body.user_info?.status ?? null,
    expiryISO: toIsoFromUnix(body.user_info?.exp_date),
    timezone: body.user_info?.timezone ?? body.server_info?.timezone ?? null,
    maxConnections: toNumber(body.user_info?.max_connections)
  };
}

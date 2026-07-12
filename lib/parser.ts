import { ParsedCredential } from "@/lib/types";

function isPrivateOrReservedHost(hostname: string): boolean {
  if (!hostname) return true;
  if (hostname === "localhost") return true;
  if (hostname === "0.0.0.0") return true;

  const ip4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ip4) {
    const octets = [Number(ip4[1]), Number(ip4[2]), Number(ip4[3]), Number(ip4[4])];
    if (octets.some((o) => o > 255)) return true;
    if (octets[0] === 0) return true;
    if (octets[0] === 10) return true;
    if (octets[0] === 127) return true;
    if (octets[0] === 169 && octets[1] === 254) return true;
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    if (octets[0] === 192 && octets[1] === 168) return true;
    if (octets[0] === 192 && octets[1] === 0 && octets[2] === 0) return true;
    if (octets[0] === 192 && octets[1] === 0 && octets[2] === 2) return true;
    if (octets[0] === 192 && octets[1] === 88 && octets[2] === 99) return true;
    if (octets[0] >= 224 && octets[0] <= 239) return true;
    if (octets[0] >= 240) return true;
  }

  return false;
}

function parseHostToken(hostToken: string): { protocol: "http" | "https"; host: string; port: number } {
  const trimmed = hostToken.trim();
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const candidate = hasProtocol ? trimmed : `http://${trimmed}`;
  const url = new URL(candidate);
  const protocol = url.protocol === "https:" ? "https" : "http";
  const port = Number(url.port || (protocol === "https" ? 443 : 80));

  if (!url.hostname) {
    throw new Error("Missing host name");
  }

  if (isPrivateOrReservedHost(url.hostname)) {
    throw new Error("Target host is a private/reserved address and is not allowed");
  }

  return { protocol, host: url.hostname, port };
}

function parseFromSpaced(input: string): { protocol: "http" | "https"; host: string; port: number; username: string; password: string } | null {
  const parts = input.trim().split(/\s+/);
  if (parts.length < 3) {
    return null;
  }

  const [hostToken, username, password] = parts;
  if (!hostToken || !username || !password) {
    return null;
  }

  const hostDetails = parseHostToken(hostToken);
  return { ...hostDetails, username, password };
}

function parseFromUrl(input: string): { protocol: "http" | "https"; host: string; port: number; username: string; password: string } {
  const url = new URL(input.trim());
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");

  if (!username || !password) {
    throw new Error("URL credentials must include username and password query params");
  }

  const protocol = url.protocol === "https:" ? "https" : "http";
  const port = Number(url.port || (protocol === "https" ? 443 : 80));
  return { protocol, host: url.hostname, port, username, password };
}

export function normalizeCredentialInput(id: string, rawInput: string): ParsedCredential {
  const spaced = parseFromSpaced(rawInput);
  const parsed = spaced ?? parseFromUrl(rawInput);

  const apiUrl = `${parsed.protocol}://${parsed.host}:${parsed.port}/player_api.php?username=${encodeURIComponent(
    parsed.username
  )}&password=${encodeURIComponent(parsed.password)}`;

  return {
    id,
    rawInput,
    protocol: parsed.protocol,
    host: parsed.host,
    port: parsed.port,
    username: parsed.username,
    password: parsed.password,
    apiUrl
  };
}

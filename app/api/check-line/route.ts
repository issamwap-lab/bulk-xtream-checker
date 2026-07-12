import { NextRequest, NextResponse } from "next/server";
import { normalizeCredentialInput } from "@/lib/parser";
import { fetchPlayerApi, mapPlayerApiToDetails } from "@/lib/provider";
import { getDaysRemaining, getEntryStatus } from "@/lib/status";
import { AccountDetails, CheckLineResult, EntryRow, EntryStatus } from "@/lib/types";

type CheckLineRequest = {
  line?: string;
  index?: number;
};

function buildEntry(
  credential: ReturnType<typeof normalizeCredentialInput>,
  details: AccountDetails,
  overrides?: Partial<EntryRow>
): EntryRow {
  const hasExpiry = Boolean(details.expiryISO);
  const accountStatus = details.status?.trim().toLowerCase() ?? null;
  const isUnlimited = !hasExpiry && accountStatus === "active";

  let daysRemaining = -1;
  let status: EntryStatus;

  if (hasExpiry) {
    daysRemaining = getDaysRemaining(details.expiryISO as string);
    status = getEntryStatus(daysRemaining);
  } else if (isUnlimited) {
    status = "valid";
  } else {
    status = "error";
  }

  return {
    id: credential.id,
    protocol: credential.protocol,
    host: credential.host,
    port: credential.port,
    username: credential.username,
    password: credential.password,
    expiryISO: details.expiryISO ?? "",
    daysRemaining,
    isUnlimited,
    status,
    accountStatus: details.status,
    timezone: details.timezone,
    maxConnections: details.maxConnections,
    ...overrides
  };
}

export async function POST(request: NextRequest) {
  let body: CheckLineRequest;

  try {
    body = (await request.json()) as CheckLineRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const line = body.line?.trim();
  const index = typeof body.index === "number" ? body.index : 0;

  if (!line) {
    return NextResponse.json({ error: "Missing line" }, { status: 400 });
  }

  const id = `line-${index}-${line.slice(0, 24).replace(/\W/g, "")}`;

  try {
    const credential = normalizeCredentialInput(id, line);
    const apiBody = await fetchPlayerApi(credential);
    const details = mapPlayerApiToDetails(apiBody, credential);
    const entry = buildEntry(credential, details);

    const result: CheckLineResult = { entry, lineNumber: index + 1 };
    return NextResponse.json(result);
  } catch (error) {
    try {
      const credential = normalizeCredentialInput(id, line);
      const result: CheckLineResult = {
        entry: buildEntry(
          credential,
          {
            host: credential.host,
            username: credential.username,
            status: null,
            expiryISO: null,
            timezone: null,
            maxConnections: null
          },
          {
            status: "error",
            errorMessage: error instanceof Error ? error.message : "Check failed"
          }
        ),
        lineNumber: index + 1
      };

      return NextResponse.json(result);
    } catch {
      const result: CheckLineResult = {
        entry: {
          id,
          protocol: "http",
          host: "-",
          port: 0,
          username: "-",
          password: "-",
          expiryISO: "",
          daysRemaining: -1,
          isUnlimited: false,
          status: "invalid",
          accountStatus: null,
          timezone: null,
          maxConnections: null,
          errorMessage: error instanceof Error ? error.message : "Invalid line format"
        },
        lineNumber: index + 1,
        parseError: true
      };
      return NextResponse.json(result);
    }
  }
}

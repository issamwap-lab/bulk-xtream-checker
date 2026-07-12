export type ParsedCredential = {
  id: string;
  rawInput: string;
  protocol: "http" | "https";
  host: string;
  port: number;
  username: string;
  password: string;
  apiUrl: string;
};

export type EntryStatus = "valid" | "expired" | "error" | "invalid";

export type EntryRow = {
  id: string;
  protocol: "http" | "https";
  host: string;
  port: number;
  username: string;
  password: string;
  expiryISO: string;
  daysRemaining: number;
  isUnlimited: boolean;
  status: EntryStatus;
  accountStatus: string | null;
  timezone: string | null;
  maxConnections: number | null;
  errorMessage?: string;
};

export type CheckLineResult = {
  entry: EntryRow;
  credential?: ParsedCredential;
  details?: AccountDetails;
  lineNumber: number;
  parseError?: boolean;
};

export type AccountDetails = {
  host: string;
  username: string;
  status: string | null;
  expiryISO: string | null;
  timezone: string | null;
  maxConnections: number | null;
};

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckLineResult } from "@/lib/types";
import { CHECK_CONCURRENCY, CLIENT_CHECK_TIMEOUT_MS } from "@/lib/config";
import {
  clearActiveEntries,
  isActiveEntry,
  loadActiveEntries,
  mergeActiveEntries,
  saveActiveEntries,
  StoredEntry
} from "@/lib/storage";

type CheckLineOutcome =
  | (CheckLineResult & { error?: string })
  | { timedOut: true }
  | { aborted: true };

type CheckStats = {
  skippedInvalid: number;
  skippedInactive: number;
  skippedTimeout: number;
};

export type UseCheckLinesReturn = {
  entries: StoredEntry[];
  checking: boolean;
  progress: { done: number; total: number };
  checkError: string | null;
  inputWarning: boolean;
  stopped: boolean;
  stats: CheckStats;
  setInputWarning: (v: boolean) => void;
  setCheckError: (v: string | null) => void;
  handleCheck: (lines: string[]) => Promise<void>;
  handleStop: () => void;
  handleClearHistory: () => void;
};

function nextIndex(cursor: { current: number }): number {
  return cursor.current++;
}

async function fetchCheckLine(
  line: string,
  index: number,
  externalSignal: AbortSignal
): Promise<CheckLineOutcome> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    CLIENT_CHECK_TIMEOUT_MS
  );
  const onExternalAbort = () => controller.abort();

  if (externalSignal.aborted) {
    clearTimeout(timeout);
    return { aborted: true };
  }
  externalSignal.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const response = await fetch("/api/check-line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line, index }),
      cache: "no-store",
      signal: controller.signal
    });

    return (await response.json()) as CheckLineResult & { error?: string };
  } catch (error) {
    if (externalSignal.aborted) {
      return { aborted: true };
    }
    if (error instanceof Error && error.name === "AbortError") {
      return { timedOut: true };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    externalSignal.removeEventListener("abort", onExternalAbort);
  }
}

export function useCheckLines(): UseCheckLinesReturn {
  const [entries, setEntries] = useState<StoredEntry[]>([]);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [checkError, setCheckError] = useState<string | null>(null);
  const [inputWarning, setInputWarning] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [stats, setStats] = useState<CheckStats>({
    skippedInvalid: 0,
    skippedInactive: 0,
    skippedTimeout: 0
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = loadActiveEntries();
    setEntries(saved);
  }, []);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setStopped(true);
  }, []);

  const handleClearHistory = useCallback(() => {
    clearActiveEntries();
    setEntries([]);
    setStats({ skippedInvalid: 0, skippedInactive: 0, skippedTimeout: 0 });
    setStopped(false);
    setProgress({ done: 0, total: 0 });
    setCheckError(null);
  }, []);

  const handleCheck = useCallback(
    async (lines: string[]) => {
      if (lines.length === 0) {
        setCheckError("The box is empty. Paste your API lines, or click \u201cLoad examples\u201d.");
        setInputWarning(true);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setInputWarning(false);
      setCheckError(null);
      setChecking(true);
      setStopped(false);
      setStats({ skippedInvalid: 0, skippedInactive: 0, skippedTimeout: 0 });
      setProgress({ done: 0, total: lines.length });

      let done = 0;
      let invalidCount = 0;
      let inactiveCount = 0;
      let timeoutCount = 0;
      let working = loadActiveEntries();
      let lastBatchTime = 0;
      let pendingResults: { line: string; stored: StoredEntry | null; skipType: "invalid" | "inactive" | "timeout" | null }[] = [];
      const cursor = { current: 0 };

      const flushBatch = () => {
        if (pendingResults.length > 0) {
          const batchLines = pendingResults
            .filter((r) => r.stored !== null)
            .map((r) => r.stored!);
          if (batchLines.length > 0) {
            working = mergeActiveEntries(working, batchLines);
            saveActiveEntries([...working]);
            setEntries([...working]);
          }
          pendingResults = [];
        }
      };

      const worker = async () => {
        while (!controller.signal.aborted) {
          const index = nextIndex(cursor);
          if (index >= lines.length) {
            return;
          }
          const line = lines[index];

          let outcome: CheckLineOutcome;
          try {
            outcome = await fetchCheckLine(line, index, controller.signal);
          } catch (error) {
            if (!controller.signal.aborted) {
              setCheckError(error instanceof Error ? error.message : "Check failed");
            }
            done += 1;
            setProgress({ done, total: lines.length });
            continue;
          }

          if ("aborted" in outcome) {
            return;
          }

          if ("timedOut" in outcome) {
            timeoutCount += 1;
          } else if (outcome.entry) {
            if (outcome.entry.status === "invalid" || outcome.parseError) {
              invalidCount += 1;
            } else {
              const stored: StoredEntry = { ...outcome.entry, rawLine: line };
              if (!isActiveEntry(stored)) {
                inactiveCount += 1;
              } else {
                pendingResults.push({ line, stored, skipType: null });
              }
            }
          } else {
            setCheckError(outcome.error ?? "Unexpected check response");
          }

          done += 1;
          setProgress({ done, total: lines.length });

          const now = Date.now();
          if (now - lastBatchTime > 500) {
            flushBatch();
            setStats({
              skippedInvalid: invalidCount,
              skippedInactive: inactiveCount,
              skippedTimeout: timeoutCount
            });
            lastBatchTime = now;
          }
        }
      };

      const poolSize = Math.min(CHECK_CONCURRENCY, lines.length);
      await Promise.all(Array.from({ length: poolSize }, () => worker()));

      flushBatch();
      abortRef.current = null;
      setStats({
        skippedInvalid: invalidCount,
        skippedInactive: inactiveCount,
        skippedTimeout: timeoutCount
      });
      setChecking(false);
    },
    []
  );

  return {
    entries,
    checking,
    progress,
    checkError,
    inputWarning,
    stopped,
    stats,
    setInputWarning,
    setCheckError,
    handleCheck,
    handleStop,
    handleClearHistory
  };
}

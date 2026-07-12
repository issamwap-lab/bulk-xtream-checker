"use client";

import { useState } from "react";
import { CHECK_CONCURRENCY, LINE_CHECK_TIMEOUT_MS } from "@/lib/config";
import { SortColumn, SortDirection, nextSortDirection } from "@/lib/sort-entries";
import { useCheckLines } from "@/hooks/use-check-lines";
import { ResultsTable } from "@/components/results-table";
import { ProgressBar } from "@/components/progress-bar";
import { ExportButtons } from "@/components/export-buttons";

const EXAMPLE_LINES = `http://york.mywire.org:8080/player_api.php?username=Miguelmelo&password=XjVKuup9BSWC
http://line.alphatx.me  f76c15289d  f1fd4cadc5
http://pro.tvxvip.com:25443/get.php?username=VBVGxsR1w2h&password=cLu8fd5Bbo&type=m3u_plus&output=ts`;

function parseLines(text: string): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line && !seen.has(line)) {
      seen.add(line);
      lines.push(line);
    }
  }
  return lines;
}

export default function HomePage() {
  const [inputText, setInputText] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const {
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
  } = useCheckLines();

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((current) => nextSortDirection(current));
      return;
    }
    setSortColumn(column);
    setSortDirection("asc");
  };

  const handleSubmit = () => {
    const lines = parseLines(inputText);
    void handleCheck(lines);
  };

  return (
    <main className="mx-auto min-h-screen max-w-none p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Bulk Xtream Checker
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-slate-600">
          Only active APIs are shown and saved automatically. Saved APIs stay
          after refresh and appear with new checks. Lines are checked{" "}
          {CHECK_CONCURRENCY} at a time, and each one times out after{" "}
          {LINE_CHECK_TIMEOUT_MS / 1000}s. Click a column title to sort A&rarr;Z
          or Z&rarr;A.
        </p>
        {entries.length > 0 ? (
          <p className="mt-1 text-xs text-emerald-700">
            {entries.length} active API(s) saved in history.
          </p>
        ) : null}
      </header>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="api-input"
            className="block text-sm font-semibold text-slate-800"
          >
            API lines
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setInputText(EXAMPLE_LINES);
                setInputWarning(false);
                setCheckError(null);
              }}
              disabled={checking}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Load examples
            </button>
          </div>
        </div>

        <p className="mb-2 text-xs text-slate-500">
          Gray placeholder text is not real input &mdash; paste your lines or
          use Load examples first.
        </p>

        <textarea
          id="api-input"
          rows={6}
          value={inputText}
          onChange={(event) => {
            setInputText(event.target.value);
            if (event.target.value.trim()) {
              setInputWarning(false);
              setCheckError(null);
            }
          }}
          placeholder={EXAMPLE_LINES}
          disabled={checking}
          className={`w-full resize-y rounded-xl border bg-slate-50/80 px-4 py-3 font-mono text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 disabled:opacity-60 ${
            inputWarning
              ? "border-red-400 ring-2 ring-red-100 focus:border-red-400"
              : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
          }`}
        />

        <form
          className="mt-4 flex flex-wrap items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <button
            type="submit"
            disabled={checking}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {checking ? "Checking..." : "Check"}
          </button>

          {checking ? (
            <button
              type="button"
              onClick={handleStop}
              className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              Stop
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleClearHistory}
            disabled={checking || entries.length === 0}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear history
          </button>

          <ExportButtons entries={entries} disabled={checking} />

          {checking || progress.total > 0 ? (
            <ProgressBar done={progress.done} total={progress.total} />
          ) : null}
        </form>

        {checkError ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {checkError}
          </div>
        ) : null}

        {stopped && !checking ? (
          <p className="mt-3 text-sm text-orange-700">
            Check stopped. Results found so far are saved.
          </p>
        ) : null}

        {stats.skippedInvalid > 0 ? (
          <p className="mt-3 text-sm text-amber-700">
            {stats.skippedInvalid} invalid line
            {stats.skippedInvalid > 1 ? "s were" : " was"} skipped.
          </p>
        ) : null}

        {stats.skippedInactive > 0 ? (
          <p className="mt-1 text-sm text-slate-600">
            {stats.skippedInactive} inactive or expired line
            {stats.skippedInactive > 1 ? "s were" : " was"} not saved.
          </p>
        ) : null}

        {stats.skippedTimeout > 0 ? (
          <p className="mt-1 text-sm text-orange-700">
            {stats.skippedTimeout} line
            {stats.skippedTimeout > 1 ? "s" : ""} timed out after{" "}
            {LINE_CHECK_TIMEOUT_MS / 1000}s and{" "}
            {stats.skippedTimeout > 1 ? "were" : "was"} skipped.
          </p>
        ) : null}
      </section>

      <ResultsTable
        entries={entries}
        checking={checking}
        progress={progress}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </main>
  );
}

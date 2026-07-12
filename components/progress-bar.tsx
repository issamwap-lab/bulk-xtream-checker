"use client";

type ProgressBarProps = {
  done: number;
  total: number;
};

export function ProgressBar({ done, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-w-[220px] flex-1">
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>Progress</span>
        <span>
          {done}/{total} ({percent}%)
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

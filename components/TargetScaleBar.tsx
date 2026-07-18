"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { useSysForgeStore } from "@/lib/store";

export default function TargetScaleBar() {
  const targetScaleRps = useSysForgeStore((s) => s.targetScaleRps);
  const setTargetScaleRps = useSysForgeStore((s) => s.setTargetScaleRps);
  const setEstimationPanelOpen = useSysForgeStore((s) => s.setEstimationPanelOpen);
  const [draft, setDraft] = useState(targetScaleRps !== null ? String(targetScaleRps) : "");

  useEffect(() => {
    setDraft(targetScaleRps !== null ? String(targetScaleRps) : "");
  }, [targetScaleRps]);

  const commit = () => {
    const value = Number(draft.replace(/,/g, ""));
    if (!draft.trim() || !Number.isFinite(value) || value <= 0) {
      setTargetScaleRps(null);
      setDraft("");
      return;
    }
    setTargetScaleRps(Math.round(value));
  };

  const active = targetScaleRps !== null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-3 py-2">
      <Target size={14} className={active ? "text-sky-400" : "text-zinc-600"} />
      <span className="shrink-0 text-xs text-zinc-400">Design Target</span>
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        placeholder="e.g. 50000"
        className="w-28 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-sky-600 focus:outline-none"
      />
      <span className="shrink-0 text-xs text-zinc-500">rps</span>
      {active && (
        <button
          onClick={() => setTargetScaleRps(null)}
          className="rounded border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        >
          Clear
        </button>
      )}
      <button
        onClick={() => setEstimationPanelOpen(true)}
        className="text-[11px] text-sky-400 hover:text-sky-300"
      >
        Not sure? Work it out
      </button>
      <p className="ml-auto hidden text-[11px] text-zinc-600 sm:block">
        Critique checks your design's real capacity against this.
      </p>
    </div>
  );
}

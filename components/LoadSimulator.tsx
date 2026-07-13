"use client";

import { Zap } from "lucide-react";
import { useSysForgeStore } from "@/lib/store";

const MAX_LOAD = 1_000_000;

export default function LoadSimulator() {
  const simulatedLoad = useSysForgeStore((s) => s.simulatedLoad);
  const setSimulatedLoad = useSysForgeStore((s) => s.setSimulatedLoad);
  const active = simulatedLoad !== null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-3 py-2">
      <Zap size={14} className={active ? "text-amber-400" : "text-zinc-600"} />
      <span className="shrink-0 text-xs text-zinc-400">Load Simulator</span>
      <input
        type="range"
        min={0}
        max={MAX_LOAD}
        step={1000}
        value={simulatedLoad ?? 0}
        onChange={(e) => setSimulatedLoad(Number(e.target.value))}
        className="w-32 flex-1 accent-amber-500 sm:w-48 sm:flex-none"
      />
      <span className="w-24 shrink-0 text-xs text-zinc-300">
        {(simulatedLoad ?? 0).toLocaleString()} rps
      </span>
      {active && (
        <button
          onClick={() => setSimulatedLoad(null)}
          className="ml-1 rounded border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        >
          Reset
        </button>
      )}
      <p className="ml-2 hidden text-[11px] text-zinc-600 sm:block">
        Drag to see which components saturate under hypothetical load.
      </p>
    </div>
  );
}

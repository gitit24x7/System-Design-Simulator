"use client";

import { Check, X, Trophy, ListChecks, Gauge } from "lucide-react";
import { Level, validateLevel } from "@/lib/campaign";
import { GraphEdge, GraphNode, SystemMetrics } from "@/lib/engine";
import { useSysForgeStore } from "@/lib/store";

export default function GuidedPanel({
  level,
  nodes,
  edges,
  metrics,
}: {
  level: Level;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: SystemMetrics;
}) {
  const { progress, allComplete } = validateLevel(level, nodes, edges, metrics);
  const mobileGuidedPanelOpen = useSysForgeStore((s) => s.mobileGuidedPanelOpen);
  const setMobileGuidedPanelOpen = useSysForgeStore((s) => s.setMobileGuidedPanelOpen);

  return (
    <>
      {mobileGuidedPanelOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileGuidedPanelOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-80 max-w-[85vw] shrink-0 flex-col gap-3 overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4 transition-transform duration-200 lg:static lg:z-auto lg:w-72 lg:max-w-none lg:translate-x-0 ${
          mobileGuidedPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">{level.title}</h2>
            <p className="mt-1 text-xs text-zinc-500">{level.scenario}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileGuidedPanelOpen(false)}
            className="shrink-0 text-zinc-500 hover:text-zinc-300 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <ListChecks size={12} />
          Functional Requirements
        </div>
        <ul className="mb-3 list-disc space-y-1 pl-4 text-xs text-zinc-400">
          {level.requirements.functional.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <Gauge size={12} />
          Non-Functional Requirements
        </div>
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
          {level.requirements.nonFunctional.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Your Progress
        </div>
        <ul className="flex flex-col gap-2">
          {progress.map((p) => (
            <li key={p.objectiveId} className="flex items-start gap-2 text-sm">
              {p.completed ? (
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <X size={16} className="mt-0.5 shrink-0 text-zinc-600" />
              )}
              <span className={p.completed ? "text-zinc-300 line-through" : "text-zinc-400"}>
                {p.description}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {allComplete && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-emerald-700 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-300">
          <Trophy size={16} />
          Level complete!
        </div>
      )}
      </aside>
    </>
  );
}

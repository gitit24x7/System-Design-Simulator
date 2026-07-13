"use client";

import { Check, X, Trophy, ListChecks, Gauge } from "lucide-react";
import { Level, validateLevel } from "@/lib/campaign";
import { GraphEdge, GraphNode, SystemMetrics } from "@/lib/engine";

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

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{level.title}</h2>
        <p className="mt-1 text-xs text-zinc-500">{level.scenario}</p>
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
  );
}

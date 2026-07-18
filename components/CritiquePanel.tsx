"use client";

import { AlertTriangle, Info, ShieldAlert, Sparkles, X } from "lucide-react";
import { analyzeCritique, CritiqueFinding, CritiqueSeverity } from "@/lib/critique";
import { GraphEdge, GraphNode, SystemMetrics } from "@/lib/engine";
import { useSysForgeStore } from "@/lib/store";

const SEVERITY_STYLE: Record<CritiqueSeverity, { icon: typeof AlertTriangle; classes: string }> = {
  critical: { icon: ShieldAlert, classes: "border-red-700 bg-red-950/40 text-red-300" },
  warning: { icon: AlertTriangle, classes: "border-amber-700 bg-amber-950/40 text-amber-300" },
  tip: { icon: Info, classes: "border-sky-700 bg-sky-950/40 text-sky-300" },
};

export default function CritiquePanel({
  nodes,
  edges,
  metrics,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: SystemMetrics;
}) {
  const open = useSysForgeStore((s) => s.critiquePanelOpen);
  const setOpen = useSysForgeStore((s) => s.setCritiquePanelOpen);
  const updateNodeDegradation = useSysForgeStore((s) => s.updateNodeDegradation);
  const targetScaleRps = useSysForgeStore((s) => s.targetScaleRps);

  if (!open) return null;

  const runAction = (action: NonNullable<CritiqueFinding["action"]>) => {
    if (action.kind === "simulate-cold-cache" || action.kind === "simulate-worker-backlog") {
      updateNodeDegradation(action.nodeId, 100);
    } else if (action.kind === "restore-cache" || action.kind === "restore-worker") {
      updateNodeDegradation(action.nodeId, 0);
    }
  };

  const findings = analyzeCritique(nodes, edges, metrics, targetScaleRps);

  return (
    <div
      className="no-export fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-zinc-700 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Design Critique</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {findings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Sparkles size={24} className="text-emerald-400" />
              <p className="text-sm font-medium text-zinc-200">No issues found</p>
              <p className="text-xs text-zinc-500">
                This design doesn&apos;t trip any of the coach&apos;s checks right now -- nice work.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {findings.map((f) => {
                const { icon: Icon, classes } = SEVERITY_STYLE[f.severity];
                return (
                  <li key={f.id} className={`rounded-md border px-3 py-2.5 ${classes}`}>
                    <div className="flex items-start gap-2">
                      <Icon size={15} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">{f.title}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-zinc-300">{f.message}</p>
                        {f.action && (
                          <button
                            type="button"
                            onClick={() => runAction(f.action!)}
                            className="mt-2 rounded-md border border-current px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
                          >
                            {f.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="border-t border-zinc-800 px-4 py-2 text-[11px] text-zinc-600">
          Rule-based, not AI -- checks your current graph against known system design patterns and anti-patterns.
        </p>
      </div>
    </div>
  );
}

"use client";

import { HeartPulse, Skull, RotateCcw, Unlink } from "lucide-react";
import { connectedNodeIds } from "@/lib/engine";
import { useSysForgeStore } from "@/lib/store";

export default function ChaosMonkey() {
  const nodes = useSysForgeStore((s) => s.nodes);
  const edges = useSysForgeStore((s) => s.edges);
  const killRandomNode = useSysForgeStore((s) => s.killRandomNode);
  const reviveAllNodes = useSysForgeStore((s) => s.reviveAllNodes);
  const severRandomEdge = useSysForgeStore((s) => s.severRandomEdge);

  // Chaos Monkey only ever targets components actually wired into the
  // design -- an isolated node dropped on the canvas was never part of the
  // running system, so it shouldn't be killable or count toward "healthy".
  const connectedIds = connectedNodeIds(edges);
  const killableNodes = nodes.filter((n) => n.data.type !== "client" && connectedIds.has(n.id));
  const healthyCount = killableNodes.filter((n) => n.data.health !== "dead").length;
  const totalCount = killableNodes.length;
  const canKill = healthyCount > 0;
  const canSever = edges.some((e) => !e.data?.severed);

  // Revive-All is a recovery action, so it stays available for any dead
  // node or severed edge, even a disconnected leftover from before.
  const canRevive = nodes.some((n) => n.data.health === "dead") || edges.some((e) => e.data?.severed);

  const btnClass =
    "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-3";

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {totalCount > 0 && (
        <span
          title="Healthy, connected components (client and unconnected components excluded)"
          className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400"
        >
          <HeartPulse size={12} className={healthyCount === totalCount ? "text-emerald-400" : "text-amber-400"} />
          {healthyCount}/{totalCount}
          <span className="hidden sm:inline">&nbsp;healthy</span>
        </span>
      )}
      <button
        onClick={killRandomNode}
        disabled={!canKill}
        className={`${btnClass} border-red-800 bg-red-950 text-red-300 hover:bg-red-900 disabled:hover:bg-red-950`}
        title={canKill ? "Chaos Monkey: kill a random connected node" : "No connected, healthy components left to kill"}
      >
        <Skull size={14} />
        <span className="hidden sm:inline">Chaos Monkey</span>
      </button>
      <button
        onClick={severRandomEdge}
        disabled={!canSever}
        className={`${btnClass} border-orange-800 bg-orange-950 text-orange-300 hover:bg-orange-900 disabled:hover:bg-orange-950`}
        title={canSever ? "Sever a random connection (simulate a network partition)" : "No connections left to sever"}
      >
        <Unlink size={14} />
        <span className="hidden sm:inline">Sever Link</span>
      </button>
      <button
        onClick={reviveAllNodes}
        disabled={!canRevive}
        className={`${btnClass} border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:hover:bg-zinc-900`}
        title={canRevive ? "Revive all nodes and heal all connections" : "Everything is already healthy"}
      >
        <RotateCcw size={14} />
        <span className="hidden sm:inline">Revive All</span>
      </button>
    </div>
  );
}

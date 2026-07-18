"use client";

import { Handle, NodeProps, Position } from "reactflow";
import {
  Archive,
  AlertTriangle,
  Blocks,
  Database,
  Flame,
  Globe,
  ListOrdered,
  Radio,
  Server,
  ShieldCheck,
  Shuffle,
  TrendingDown,
  User,
  Zap,
  Cog,
  LucideIcon,
} from "lucide-react";
import {
  getDisplayLabel,
  getEffectiveBaseCost,
  getEffectiveLatencyMs,
  getEffectiveMaxRps,
  getProviderCostMultiplier,
  SystemComponent,
  UNLIMITED_RPS,
} from "@/lib/engine";
import { useSysForgeStore } from "@/lib/store";

const ICONS: Record<SystemComponent["type"], LucideIcon> = {
  client: User,
  cdn: Globe,
  "load-balancer": Shuffle,
  "api-gateway": ShieldCheck,
  api: Server,
  cache: Zap,
  database: Database,
  "object-storage": Archive,
  queue: ListOrdered,
  "message-broker": Radio,
  worker: Cog,
  custom: Blocks,
};

// Every component type gets its own solid color, like the icon sets in real
// architecture-diagramming tools -- a colored badge reads at a glance from
// across the canvas, where a mono-color icon and a wall of similar gray
// rectangles don't.
const ICON_BG: Record<SystemComponent["type"], string> = {
  client: "bg-slate-500",
  cdn: "bg-sky-500",
  "load-balancer": "bg-orange-500",
  "api-gateway": "bg-fuchsia-600",
  api: "bg-blue-600",
  cache: "bg-red-600",
  database: "bg-amber-500",
  "object-storage": "bg-yellow-600",
  queue: "bg-teal-500",
  "message-broker": "bg-purple-600",
  worker: "bg-green-600",
  custom: "bg-violet-500",
};

// Touch devices can't trigger :hover, so handles get a low baseline opacity
// and a larger hit target below the sm breakpoint. Desktop handles stay
// dimly visible (rather than fully hidden) so users can see where to grab
// from before hovering, then brighten and grow on hover/drag. The `before:`
// pseudo-element pads the actual pointer hit area well beyond the visible
// dot -- matching the generous hit-slop professional diagramming tools use
// so a slightly-off grab still starts a connection.
const HANDLE_CLASS =
  "!h-3.5 !w-3.5 !border !border-zinc-400 !bg-zinc-700 opacity-50 transition-all before:absolute before:-inset-2.5 before:content-[''] hover:!scale-125 hover:!border-sky-400 hover:!bg-sky-500 sm:!h-2.5 sm:!w-2.5 sm:opacity-30 sm:group-hover:opacity-100 sm:group-hover:!h-3 sm:group-hover:!w-3";

export default function SystemNode({ id, data }: NodeProps<SystemComponent>) {
  const Icon = ICONS[data.type];
  const isDead = data.health === "dead";
  const isSelected = useSysForgeStore((s) => s.selectedNodeId === id);
  const selectNode = useSysForgeStore((s) => s.selectNode);
  const provider = useSysForgeStore((s) => s.provider);
  const isSaturated = useSysForgeStore((s) => s.saturatedNodeIds.includes(id));
  const isDegraded = data.degradation > 0;

  const displayLabel = data.customLabel || getDisplayLabel(data.type, data.variant, provider);
  const effectiveRps = Math.round(getEffectiveMaxRps(data));
  const effectiveLatency = Math.round(getEffectiveLatencyMs(data) * 10) / 10;
  const effectiveCost = Math.round(
    getEffectiveBaseCost(data) * getProviderCostMultiplier(data.type, data.variant, provider)
  );

  // Only one ring shown at a time, in priority order -- dead trumps
  // everything, then the user's own selection, then live simulation state.
  const ringClass = isDead
    ? "ring-2 ring-red-500"
    : isSelected
      ? "ring-2 ring-sky-400"
      : isSaturated
        ? "ring-2 ring-amber-400 animate-pulse"
        : isDegraded
          ? "ring-2 ring-purple-400"
          : "ring-1 ring-zinc-700 group-hover:ring-zinc-500";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectNode(id);
      }}
      className="group relative flex w-[92px] cursor-pointer flex-col items-center gap-1"
    >
      {/* Floating connection points on every side, connectable in either
          direction (connectionMode="loose"). The rendered edge ignores which
          handle was grabbed and instead floats between the two nodes'
          closest boundary points, so placement never produces messy lines. */}
      <Handle type="source" position={Position.Top} id="top" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right} id="right" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Left} id="left" className={HANDLE_CLASS} />

      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md transition-all ${ICON_BG[data.type]} ${ringClass} ${
          isDead ? "grayscale" : ""
        }`}
      >
        <Icon size={22} className="text-white" strokeWidth={2} />
        {isDead && (
          <span
            title="Dead"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 ring-1 ring-red-500"
          >
            <Flame size={12} className="animate-pulse text-orange-500" />
          </span>
        )}
        {!isDead && isSaturated && (
          <span
            title="This is the current bottleneck"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 ring-1 ring-amber-500"
          >
            <AlertTriangle size={12} className="text-amber-400" />
          </span>
        )}
        {!isDead && !isSaturated && isDegraded && (
          <span
            title={`Simulated degradation: ${data.degradation}%`}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 ring-1 ring-purple-500"
          >
            <TrendingDown size={12} className="text-purple-400" />
          </span>
        )}
      </div>

      <span className="max-w-full truncate text-center text-[11px] font-medium leading-tight text-zinc-100">
        {displayLabel}
      </span>

      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-center text-[9px] leading-tight text-zinc-500">
        <span>{data.maxRps >= UNLIMITED_RPS ? "∞" : effectiveRps} rps</span>
        <span>{effectiveLatency}ms</span>
        <span>${effectiveCost}/mo</span>
        {data.type === "database" && <span>CAP {data.consistency}%</span>}
        {data.type === "cache" && <span>{Math.round(data.cacheHitRatePct ?? 85)}% hit</span>}
      </div>
    </div>
  );
}

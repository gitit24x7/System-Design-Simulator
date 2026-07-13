"use client";

import { Handle, NodeProps, Position } from "reactflow";
import {
  Archive,
  AlertTriangle,
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
};

// Touch devices can't trigger :hover, so handles get a low baseline opacity
// and a larger hit target below the sm breakpoint; desktop keeps the
// hover-to-reveal behavior so the canvas stays uncluttered.
const HANDLE_CLASS =
  "!h-3.5 !w-3.5 !border !border-zinc-400 !bg-zinc-700 opacity-40 transition-opacity sm:!h-2.5 sm:!w-2.5 sm:opacity-0 sm:group-hover:opacity-100";

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

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectNode(id);
      }}
      className={`group relative flex min-w-[140px] cursor-pointer flex-col gap-1 rounded-lg border-2 px-3 py-2 shadow-md transition-colors ${
        isDead
          ? "border-red-600 bg-red-950/60 grayscale"
          : isSelected
            ? "border-sky-500 bg-zinc-900"
            : isSaturated
              ? "border-amber-500 bg-zinc-900 animate-pulse"
              : isDegraded
                ? "border-purple-500 bg-zinc-900"
                : "border-zinc-700 bg-zinc-900"
      }`}
    >
      {/* Floating connection points on every side, connectable in either
          direction (connectionMode="loose"). The rendered edge ignores which
          handle was grabbed and instead floats between the two nodes'
          closest boundary points, so placement never produces messy lines. */}
      <Handle type="source" position={Position.Top} id="top" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right} id="right" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Left} id="left" className={HANDLE_CLASS} />

      <div className="flex items-center gap-2">
        <Icon size={16} className={isDead ? "text-red-400" : "text-emerald-400"} />
        <span className="text-sm font-medium text-zinc-100">{displayLabel}</span>
        {isDead && <Flame size={14} className="ml-auto animate-pulse text-orange-500" />}
        {!isDead && (isSaturated || isDegraded) && (
          <span className="ml-auto flex items-center gap-1">
            {isSaturated && (
              <span title="This is the current bottleneck">
                <AlertTriangle size={14} className="text-amber-400" />
              </span>
            )}
            {isDegraded && (
              <span title={`Simulated degradation: ${data.degradation}%`}>
                <TrendingDown size={14} className="text-purple-400" />
              </span>
            )}
          </span>
        )}
      </div>

      <div className="flex gap-2 text-[10px] text-zinc-400">
        <span>{data.maxRps >= UNLIMITED_RPS ? "∞" : effectiveRps} rps</span>
        <span>{effectiveLatency}ms</span>
        <span>${effectiveCost}/mo</span>
        {data.type === "database" && <span>CAP {data.consistency}%</span>}
      </div>
    </div>
  );
}

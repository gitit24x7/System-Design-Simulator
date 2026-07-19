"use client";

import { Handle, NodeProps, Position } from "reactflow";
import { AlertTriangle, Flame, TrendingDown } from "lucide-react";
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
import { BEVEL_SHADOW, ICON_GRADIENT } from "@/lib/iconTheme";
import ComponentIcon from "./ComponentIcon";

// One invisible handle covering the entire icon badge, instead of four small
// dots at fixed points -- a connection can be grabbed from anywhere on the
// icon, not just a specific corner. `before:-inset-1.5` extends the hit area
// a little past the icon's own edge so a grab that's just barely outside it
// still counts. No visible dot; the hover/connecting/valid feedback (see
// globals.css) is what tells you this area is interactive.
const HANDLE_CLASS =
  "!absolute !inset-0 !z-20 !h-full !w-full !translate-x-0 !translate-y-0 !rounded-xl !border-0 !bg-transparent !opacity-0 cursor-crosshair transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:!bg-white/10";

export default function SystemNode({ id, data }: NodeProps<SystemComponent>) {
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
      className="group relative flex w-[92px] cursor-pointer flex-col items-center gap-1 pb-1 pt-2"
    >
      {/* A single handle covers the whole icon badge (not four fixed dots),
          so a connection can be grabbed from anywhere on it. Connectable in
          either direction (connectionMode="loose"); the rendered edge
          ignores where exactly it was grabbed and floats between the two
          icons' closest boundary points instead. */}
      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md transition-all ${ICON_GRADIENT[data.type]} ${ringClass} ${
          isDead ? "grayscale" : ""
        }`}
        style={{ boxShadow: `${BEVEL_SHADOW}, 0 2px 4px rgba(0,0,0,0.3)` }}
      >
        <Handle type="source" position={Position.Top} id="center" className={HANDLE_CLASS} />

        <ComponentIcon type={data.type} size={22} />

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

"use client";

import { useCallback } from "react";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath, useStore } from "reactflow";
import { Link2Off, Unplug, X } from "lucide-react";
import { getFloatingEdgeParams } from "@/lib/floatingEdge";
import { useSysForgeStore } from "@/lib/store";

export default function FloatingEdge({ id, source, target, markerEnd, style, data }: EdgeProps) {
  const sourceNode = useStore(useCallback((s) => s.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((s) => s.nodeInternals.get(target), [target]));
  const removeEdge = useSysForgeStore((s) => s.removeEdge);
  const toggleEdgeSevered = useSysForgeStore((s) => s.toggleEdgeSevered);
  const simulateTraffic = useSysForgeStore((s) => s.simulateTraffic);

  if (
    !sourceNode?.positionAbsolute ||
    !targetNode?.positionAbsolute ||
    !sourceNode.width ||
    !sourceNode.height ||
    !targetNode.width ||
    !targetNode.height
  ) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getFloatingEdgeParams(
    { positionAbsolute: sourceNode.positionAbsolute, width: sourceNode.width, height: sourceNode.height },
    { positionAbsolute: targetNode.positionAbsolute, width: targetNode.width, height: targetNode.height }
  );

  // borderRadius: 0 gives sharp 90-degree corners (a "step" edge) instead of
  // the default rounded smoothstep joints.
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
    borderRadius: 0,
  });

  const isSevered = Boolean(data?.severed);
  const effectiveStyle = isSevered
    ? { ...style, stroke: "#f97316", strokeDasharray: "6 4" }
    : style;

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={isSevered ? undefined : markerEnd} style={effectiveStyle} />
      {!isSevered && simulateTraffic && (
        <circle r="4" fill={(style?.stroke as string) ?? "#60a5fa"}>
          <animateMotion dur="1.6s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan group flex items-center gap-1"
        >
          {isSevered ? (
            <span className="rounded bg-orange-950/90 px-1.5 py-0.5 text-[9px] text-orange-300">
              severed
            </span>
          ) : (
            data?.status && (
              <span className="rounded bg-zinc-950/90 px-1.5 py-0.5 text-[9px] capitalize text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
                {data.status}
              </span>
            )
          )}
          <button
            onClick={() => toggleEdgeSevered(id)}
            title={isSevered ? "Heal connection" : "Sever connection (simulate network partition)"}
            className={`flex h-4 w-4 items-center justify-center rounded-full border text-zinc-400 opacity-70 transition-opacity hover:opacity-100 group-hover:opacity-100 ${
              isSevered
                ? "border-orange-500 bg-orange-950 text-orange-300"
                : "border-zinc-600 bg-zinc-900 hover:border-orange-500 hover:text-orange-400"
            }`}
          >
            {isSevered ? <Unplug size={10} /> : <Link2Off size={10} />}
          </button>
          <button
            onClick={() => removeEdge(id)}
            title="Remove connection"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-400 opacity-70 transition-opacity hover:border-red-500 hover:text-red-400 hover:opacity-100 group-hover:opacity-100"
          >
            <X size={10} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

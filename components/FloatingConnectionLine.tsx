"use client";

import { ConnectionLineComponentProps, getSmoothStepPath } from "reactflow";
import { getFloatingEdgeParams, oppositePosition, toIconRect } from "@/lib/floatingEdge";

// The in-progress line while dragging out a new connection. Rather than
// exiting from whichever fixed side the grabbed handle declares (which looks
// rigid -- the line always starts by going, say, straight up, even if you're
// dragging down-right), this recomputes the exit side every render against
// the live cursor position, the same "floating" logic finished edges use.
// The corner the line turns at moves fluidly as the mouse moves, instead of
// being locked in from the moment the drag started.
export default function FloatingConnectionLine({
  fromNode,
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}: ConnectionLineComponentProps) {
  if (!fromNode?.positionAbsolute || !fromNode.width || !fromNode.height) {
    return <path d={`M${fromX},${fromY} L${toX},${toY}`} fill="none" style={connectionLineStyle} />;
  }

  const sourceRect =
    fromNode.type === "systemNode"
      ? toIconRect({ positionAbsolute: fromNode.positionAbsolute, width: fromNode.width, height: fromNode.height })
      : { positionAbsolute: fromNode.positionAbsolute, width: fromNode.width, height: fromNode.height };

  // Treat the live cursor as a zero-size "node" so the same intersection math
  // picks a source exit point that reorients toward wherever the mouse
  // currently is.
  const { sx, sy, sourcePos } = getFloatingEdgeParams(sourceRect, {
    positionAbsolute: { x: toX, y: toY },
    width: 0,
    height: 0,
  });

  const [path] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: toX,
    targetY: toY,
    targetPosition: oppositePosition(sourcePos),
    borderRadius: 12,
  });

  return (
    <g>
      <path d={path} fill="none" style={connectionLineStyle} />
      <circle cx={toX} cy={toY} r={4} fill={(connectionLineStyle?.stroke as string) ?? "#38bdf8"} stroke="none" />
    </g>
  );
}

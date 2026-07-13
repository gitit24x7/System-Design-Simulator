"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useReactFlow, useViewport } from "reactflow";
import { useSysForgeStore, Stroke } from "@/lib/store";

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
}

function strokePath(stroke: Stroke): string {
  if (stroke.type === "arrow" && stroke.points.length >= 2) {
    const [start, end] = [stroke.points[0], stroke.points[stroke.points.length - 1]];
    return `M ${start.x},${start.y} L ${end.x},${end.y}`;
  }
  return pointsToPath(stroke.points);
}

function markerId(color: string): string {
  return `sysforge-arrowhead-${color.replace("#", "")}`;
}

export default function AnnotationLayer() {
  const strokes = useSysForgeStore((s) => s.strokes);
  const drawTool = useSysForgeStore((s) => s.drawTool);
  const drawColor = useSysForgeStore((s) => s.drawColor);
  const addStroke = useSysForgeStore((s) => s.addStroke);
  const removeStroke = useSysForgeStore((s) => s.removeStroke);

  const { screenToFlowPosition } = useReactFlow();
  const { x: viewX, y: viewY, zoom } = useViewport();
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[] | null>(null);
  const drawingRef = useRef(false);
  // Mirrors currentPoints synchronously so onPointerUp can read the final
  // value without putting the addStroke side effect inside a setState
  // updater (React Strict Mode double-invokes updater functions in dev,
  // which would otherwise commit each stroke twice).
  const pointsRef = useRef<{ x: number; y: number }[] | null>(null);

  const isDrawing = drawTool === "pen" || drawTool === "arrow";

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      const pt = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      drawingRef.current = true;
      pointsRef.current = [pt];
      setCurrentPoints([pt]);
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [isDrawing, screenToFlowPosition]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawingRef.current || !pointsRef.current) return;
      const pt = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const next = drawTool === "arrow" ? [pointsRef.current[0], pt] : [...pointsRef.current, pt];
      pointsRef.current = next;
      setCurrentPoints(next);
    },
    [drawTool, screenToFlowPosition]
  );

  const onPointerUp = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const finalPoints = pointsRef.current;
    pointsRef.current = null;
    setCurrentPoints(null);
    if (finalPoints && finalPoints.length >= 2 && (drawTool === "pen" || drawTool === "arrow")) {
      addStroke({ type: drawTool, points: finalPoints, color: drawColor });
    }
  }, [addStroke, drawColor, drawTool]);

  const usedColors = useMemo(() => {
    const colors = new Set(strokes.filter((s) => s.type === "arrow").map((s) => s.color));
    if (drawTool === "arrow") colors.add(drawColor);
    return [...colors];
  }, [strokes, drawTool, drawColor]);

  const cursor = drawTool === "select" ? "default" : drawTool === "eraser" ? "crosshair" : "crosshair";

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 z-10 h-full w-full"
      style={{ pointerEvents: drawTool === "select" ? "none" : "auto", cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <defs>
        {usedColors.map((color) => (
          <marker
            key={color}
            id={markerId(color)}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L7,3 z" fill={color} />
          </marker>
        ))}
      </defs>
      <g style={{ transform: `translate(${viewX}px, ${viewY}px) scale(${zoom})`, transformOrigin: "0 0" }}>
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={strokePath(stroke)}
            stroke={stroke.color}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={stroke.type === "arrow" ? `url(#${markerId(stroke.color)})` : undefined}
            onClick={drawTool === "eraser" ? () => removeStroke(stroke.id) : undefined}
            className={drawTool === "eraser" ? "hover:opacity-40" : undefined}
            style={{ pointerEvents: drawTool === "eraser" ? "stroke" : "none" }}
          />
        ))}
        {currentPoints && (
          <path
            d={pointsToPath(currentPoints)}
            stroke={drawColor}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
            markerEnd={drawTool === "arrow" ? `url(#${markerId(drawColor)})` : undefined}
          />
        )}
      </g>
    </svg>
  );
}

"use client";

import { Eraser, MousePointer2, MoveUpRight, Pencil, Trash2 } from "lucide-react";
import { ANNOTATION_COLORS, DrawTool, useSysForgeStore } from "@/lib/store";

const TOOLS: { id: DrawTool; icon: typeof MousePointer2; title: string }[] = [
  { id: "select", icon: MousePointer2, title: "Select / pan (Esc)" },
  { id: "pen", icon: Pencil, title: "Freehand pen" },
  { id: "arrow", icon: MoveUpRight, title: "Arrow" },
  { id: "eraser", icon: Eraser, title: "Erase an annotation" },
];

export default function AnnotationToolbar() {
  const drawTool = useSysForgeStore((s) => s.drawTool);
  const setDrawTool = useSysForgeStore((s) => s.setDrawTool);
  const drawColor = useSysForgeStore((s) => s.drawColor);
  const setDrawColor = useSysForgeStore((s) => s.setDrawColor);
  const strokeCount = useSysForgeStore((s) => s.strokes.length);
  const clearStrokes = useSysForgeStore((s) => s.clearStrokes);

  return (
    <div className="no-export absolute left-4 top-4 z-20 flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/95 p-1.5 shadow-lg">
      {TOOLS.map(({ id, icon: Icon, title }) => (
        <button
          key={id}
          onClick={() => setDrawTool(id)}
          title={title}
          className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
            drawTool === id
              ? "bg-emerald-950 text-emerald-300"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          <Icon size={15} />
        </button>
      ))}

      {(drawTool === "pen" || drawTool === "arrow") && (
        <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
          {ANNOTATION_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setDrawColor(color)}
              title={color}
              className={`h-5 w-5 rounded-full border-2 transition-transform ${
                drawColor === color ? "scale-110 border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {strokeCount > 0 && (
        <button
          onClick={clearStrokes}
          title="Clear all annotations"
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-red-950 hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

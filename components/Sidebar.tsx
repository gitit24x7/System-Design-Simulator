"use client";

import { StickyNote, X } from "lucide-react";
import { useReactFlow } from "reactflow";
import { ComponentType, TYPE_LABELS } from "@/lib/engine";
import { BEVEL_SHADOW, ICON_GRADIENT } from "@/lib/iconTheme";
import { useSysForgeStore } from "@/lib/store";
import ComponentIcon from "./ComponentIcon";

const PALETTE: ComponentType[] = [
  "client",
  "cdn",
  "load-balancer",
  "api-gateway",
  "api",
  "cache",
  "database",
  "object-storage",
  "queue",
  "message-broker",
  "worker",
];

export default function Sidebar() {
  const addNode = useSysForgeStore((s) => s.addNode);
  const addNote = useSysForgeStore((s) => s.addNote);
  const mobileSidebarOpen = useSysForgeStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useSysForgeStore((s) => s.setMobileSidebarOpen);
  const { screenToFlowPosition } = useReactFlow();

  const onDragStart = (event: React.DragEvent, type: ComponentType) => {
    event.dataTransfer.setData("application/sysforge-node", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const cascadePosition = () => {
    const pane = document.querySelector(".react-flow");
    const rect = pane?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    // Read the freshest node count directly from the store (not the reactive
    // hook value) so rapid successive clicks each get a distinct cascade step.
    const step = useSysForgeStore.getState().nodes.length % 9;
    const offsetX = (step % 3) * 220 - 220;
    const offsetY = Math.floor(step / 3) * 130 - 130;

    return screenToFlowPosition({ x: cx + offsetX, y: cy + offsetY });
  };

  const onClickAdd = (type: ComponentType) => {
    addNode(type, cascadePosition());
    setMobileSidebarOpen(false);
  };
  const onClickAddNote = () => {
    addNote(cascadePosition());
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-2 transition-transform duration-200 lg:static lg:z-auto lg:w-44 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-0.5 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Components
          </h2>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mb-0.5 text-[10px] leading-snug text-zinc-600">Click to place, or drag onto the canvas.</p>
        {PALETTE.map((type) => (
          <button
            key={type}
            type="button"
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            onClick={() => onClickAdd(type)}
            className="flex cursor-grab items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-left text-[13px] text-zinc-200 transition-colors hover:border-emerald-600 hover:bg-zinc-800 active:cursor-grabbing"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${ICON_GRADIENT[type]}`}
              style={{ boxShadow: BEVEL_SHADOW }}
            >
              <ComponentIcon type={type} size={14} />
            </span>
            <span className="truncate">{TYPE_LABELS[type]}</span>
          </button>
        ))}

        <div className="my-0.5 border-t border-zinc-800" />
        <button
          type="button"
          draggable
          onDragStart={(e) => onDragStart(e, "custom")}
          onClick={() => onClickAdd("custom")}
          title="Add a component with your own name, throughput, latency, and cost"
          className="flex cursor-grab items-center gap-1.5 rounded-md border border-dashed border-violet-700/60 bg-violet-950/20 px-2 py-1.5 text-left text-[13px] text-violet-200 transition-colors hover:border-violet-500 hover:bg-violet-950/40 active:cursor-grabbing"
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${ICON_GRADIENT.custom}`}
            style={{ boxShadow: BEVEL_SHADOW }}
          >
            <ComponentIcon type="custom" size={14} />
          </span>
          <span className="truncate">Custom Component</span>
        </button>
        <button
          type="button"
          onClick={onClickAddNote}
          className="flex items-center gap-1.5 rounded-md border border-amber-800/50 bg-amber-950/30 px-2 py-1.5 text-left text-[13px] text-amber-200 transition-colors hover:border-amber-600 hover:bg-amber-950/60"
        >
          <StickyNote size={14} className="shrink-0 text-amber-400" />
          <span className="truncate">Sticky Note</span>
        </button>
      </aside>
    </>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useReactFlow, useStore } from "reactflow";
import dagre from "dagre";
import { toPng } from "html-to-image";
import {
  Check,
  Download,
  LayoutGrid,
  Link as LinkIcon,
  Pause,
  Play,
  Redo2,
  Undo2,
} from "lucide-react";
import { useSysForgeStore } from "@/lib/store";
import { CloudProvider, PROVIDER_LABELS } from "@/lib/engine";
import ProjectsMenu from "./ProjectsMenu";
import LevelSelector from "./LevelSelector";

const PROVIDERS: CloudProvider[] = ["generic", "aws", "gcp", "azure"];

function fallbackCopy(text: string, onDone: () => void) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } catch {
    // ignore -- worst case the user can select the URL from the prompt below
  }
  document.body.removeChild(textarea);
  onDone();
}

function layoutWithDagre(
  nodeIds: string[],
  edges: { source: string; target: string; severed?: boolean }[],
  dims: Map<string, { width: number; height: number }>
): Record<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 110 });
  g.setDefaultEdgeLabel(() => ({}));

  nodeIds.forEach((id) => {
    const { width, height } = dims.get(id) ?? { width: 180, height: 72 };
    g.setNode(id, { width, height });
  });
  edges.forEach((e) => {
    if (!e.severed) g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const positions: Record<string, { x: number; y: number }> = {};
  nodeIds.forEach((id) => {
    const pos = g.node(id);
    if (pos) positions[id] = { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 };
  });
  return positions;
}

export default function Toolbar() {
  const nodes = useSysForgeStore((s) => s.nodes);
  const edges = useSysForgeStore((s) => s.edges);
  const past = useSysForgeStore((s) => s.past);
  const future = useSysForgeStore((s) => s.future);
  const undo = useSysForgeStore((s) => s.undo);
  const redo = useSysForgeStore((s) => s.redo);
  const applyLayout = useSysForgeStore((s) => s.applyLayout);
  const simulateTraffic = useSysForgeStore((s) => s.simulateTraffic);
  const toggleSimulateTraffic = useSysForgeStore((s) => s.toggleSimulateTraffic);
  const provider = useSysForgeStore((s) => s.provider);
  const setProvider = useSysForgeStore((s) => s.setProvider);
  const appMode = useSysForgeStore((s) => s.appMode);
  const setAppMode = useSysForgeStore((s) => s.setAppMode);

  const nodeInternals = useStore((s) => s.nodeInternals);
  const { fitView } = useReactFlow();
  const [copied, setCopied] = useState(false);

  const onTidyUp = useCallback(() => {
    const dims = new Map<string, { width: number; height: number }>();
    nodes.forEach((n) => {
      const rfNode = nodeInternals.get(n.id);
      dims.set(n.id, { width: rfNode?.width ?? 180, height: rfNode?.height ?? 72 });
    });
    const positions = layoutWithDagre(
      nodes.map((n) => n.id),
      edges.map((e) => ({ source: e.source, target: e.target, severed: e.data?.severed })),
      dims
    );
    applyLayout(positions);
    setTimeout(() => fitView({ duration: 300 }), 50);
  }, [nodes, edges, nodeInternals, applyLayout, fitView]);

  const onExportPng = useCallback(() => {
    const el = document.getElementById("sysforge-canvas-wrapper");
    if (!el) return;
    toPng(el, {
      backgroundColor: "#18181b",
      filter: (n) => {
        const el = n as HTMLElement;
        return (
          !el.classList?.contains("react-flow__minimap") &&
          !el.classList?.contains("react-flow__controls") &&
          !el.classList?.contains("no-export")
        );
      },
    }).then((dataUrl) => {
      const a = document.createElement("a");
      a.download = "sysforge-design.png";
      a.href = dataUrl;
      a.click();
    });
  }, []);

  const onShare = useCallback(() => {
    const { nodes, edges, notes, strokes } = useSysForgeStore.getState();
    const payload = JSON.stringify({ nodes, edges, notes, strokes });
    const encoded = btoa(encodeURIComponent(payload));
    const url = `${window.location.origin}${window.location.pathname}?design=${encoded}`;

    const showCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(showCopied, () => fallbackCopy(url, showCopied));
    } else {
      fallbackCopy(url, showCopied);
    }
  }, []);

  const btnClass =
    "flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-zinc-900";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-2 py-1.5">
      <button onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)" className={btnClass}>
        <Undo2 size={14} />
      </button>
      <button onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)" className={btnClass}>
        <Redo2 size={14} />
      </button>
      <button onClick={onTidyUp} title="Auto-arrange the graph" className={btnClass}>
        <LayoutGrid size={14} />
        Tidy Up
      </button>
      <button
        onClick={toggleSimulateTraffic}
        title="Animate traffic flowing through the system"
        className={`${btnClass} ${simulateTraffic ? "border-emerald-600 bg-emerald-950/50 text-emerald-300" : ""}`}
      >
        {simulateTraffic ? <Pause size={14} /> : <Play size={14} />}
        Simulate Traffic
      </button>
      <button onClick={onExportPng} title="Export as PNG" className={btnClass}>
        <Download size={14} />
        Export
      </button>
      <button onClick={onShare} title="Copy a shareable link to this design" className={btnClass}>
        {copied ? <Check size={14} className="text-emerald-400" /> : <LinkIcon size={14} />}
        {copied ? "Copied!" : "Share"}
      </button>
      <ProjectsMenu />

      <div className="ml-2 flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 p-0.5">
        <button
          onClick={() => setAppMode("guided")}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            appMode === "guided" ? "bg-emerald-950 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Guided
        </button>
        <button
          onClick={() => setAppMode("sandbox")}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            appMode === "sandbox" ? "bg-emerald-950 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Sandbox
        </button>
      </div>
      {appMode === "guided" && <LevelSelector />}

      <div className="ml-auto flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 p-0.5">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              provider === p ? "bg-emerald-950 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {PROVIDER_LABELS[p]}
          </button>
        ))}
      </div>
    </div>
  );
}

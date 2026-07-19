"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  MiniMap,
  Node,
  NodeChange,
  ReactFlowInstance,
  ReactFlowProvider,
  useViewport,
} from "reactflow";
import "reactflow/dist/style.css";
import { useSysForgeStore } from "@/lib/store";
import { calculateSystemMetrics, ComponentType } from "@/lib/engine";
import { DEFAULT_LEVEL_ID, getLevel } from "@/lib/campaign";
import SystemNode from "./SystemNode";
import NoteNode from "./NoteNode";
import FloatingEdge from "./FloatingEdge";
import FloatingConnectionLine from "./FloatingConnectionLine";
import Sidebar from "./Sidebar";
import MetricsHUD from "./MetricsHUD";
import ChaosMonkey from "./ChaosMonkey";
import ChaosToast from "./ChaosToast";
import GuidedPanel from "./GuidedPanel";
import NodeInspector from "./NodeInspector";
import Toolbar from "./Toolbar";
import LoadSimulator from "./LoadSimulator";
import OnboardingModal from "./OnboardingModal";
import AnnotationLayer from "./AnnotationLayer";
import AnnotationToolbar from "./AnnotationToolbar";
import CritiquePanel from "./CritiquePanel";
import GlossaryPanel from "./GlossaryPanel";
import EstimationDrills from "./EstimationDrills";
import TargetScaleBar from "./TargetScaleBar";

const nodeTypes = { systemNode: SystemNode, noteNode: NoteNode };
const edgeTypes = { floating: FloatingEdge };
const SNAP_GRID: [number, number] = [16, 16];
const ALIGN_THRESHOLD = 6;

function isTypingTarget(el: EventTarget | null) {
  const tag = (el as HTMLElement)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement)?.isContentEditable;
}

function CanvasInner() {
  const nodes = useSysForgeStore((s) => s.nodes);
  const edges = useSysForgeStore((s) => s.edges);
  const notes = useSysForgeStore((s) => s.notes);
  const provider = useSysForgeStore((s) => s.provider);
  const appMode = useSysForgeStore((s) => s.appMode);
  const simulatedLoad = useSysForgeStore((s) => s.simulatedLoad);
  const currentLevelId = useSysForgeStore((s) => s.currentLevelId);
  const onNodesChange = useSysForgeStore((s) => s.onNodesChange);
  const onEdgesChange = useSysForgeStore((s) => s.onEdgesChange);
  const onNotesChange = useSysForgeStore((s) => s.onNotesChange);
  const onConnect = useSysForgeStore((s) => s.onConnect);
  const addNode = useSysForgeStore((s) => s.addNode);
  const selectNode = useSysForgeStore((s) => s.selectNode);
  const selectedNodeId = useSysForgeStore((s) => s.selectedNodeId);
  const duplicateNode = useSysForgeStore((s) => s.duplicateNode);
  const undo = useSysForgeStore((s) => s.undo);
  const redo = useSysForgeStore((s) => s.redo);
  const setLiveMetrics = useSysForgeStore((s) => s.setLiveMetrics);
  const drawTool = useSysForgeStore((s) => s.drawTool);
  const setDrawTool = useSysForgeStore((s) => s.setDrawTool);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const [guideX, setGuideX] = useState<number | null>(null);
  const [guideY, setGuideY] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { x: viewX, y: viewY, zoom } = useViewport();

  const demandCapRps = appMode === "sandbox" && simulatedLoad !== null ? simulatedLoad : undefined;
  const metrics = useMemo(
    () => calculateSystemMetrics(nodes, edges, provider, demandCapRps),
    [nodes, edges, provider, demandCapRps]
  );
  const level = getLevel(currentLevelId) ?? getLevel(DEFAULT_LEVEL_ID) ?? null;

  useEffect(() => {
    setLiveMetrics(metrics.bottleneckNodeId, metrics.saturatedNodeIds);
  }, [metrics.bottleneckNodeId, metrics.saturatedNodeIds, setLiveMetrics]);

  // Hydrate from a shared link (?design=<base64 json>) once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const design = params.get("design");
    if (!design) return;
    try {
      const payload = JSON.parse(decodeURIComponent(atob(design)));
      if (Array.isArray(payload.nodes) && Array.isArray(payload.edges)) {
        useSysForgeStore.setState({
          nodes: payload.nodes,
          edges: payload.edges,
          notes: Array.isArray(payload.notes) ? payload.notes : [],
          strokes: Array.isArray(payload.strokes) ? payload.strokes : [],
          past: [],
          future: [],
        });
      }
    } catch {
      // ignore malformed share links
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Escape" && drawTool !== "select") {
        setDrawTool("select");
        return;
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (key === "d" && selectedNodeId) {
        e.preventDefault();
        duplicateNode(selectedNodeId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, duplicateNode, selectedNodeId, drawTool, setDrawTool]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/sysforge-node") as ComponentType;
      if (!type || !rfInstance.current || !wrapperRef.current) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = rfInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      addNode(type, position);
    },
    [addNode]
  );

  // Notes and system nodes are two separate, independently-typed store
  // arrays (to keep SystemComponent strongly typed) but React Flow wants
  // one combined nodes prop -- split changes back out by id prefix.
  const combinedNodes = useMemo(() => [...nodes, ...notes], [nodes, notes]);
  const onCombinedNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const noteChanges = changes.filter((c) => "id" in c && c.id.startsWith("note-"));
      const nodeChanges = changes.filter((c) => !("id" in c) || !c.id.startsWith("note-"));
      if (nodeChanges.length) onNodesChange(nodeChanges);
      if (noteChanges.length) onNotesChange(noteChanges);
    },
    [onNodesChange, onNotesChange]
  );

  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      let matchX: number | null = null;
      let matchY: number | null = null;
      for (const n of nodes) {
        if (n.id === draggedNode.id) continue;
        if (matchX === null && Math.abs(n.position.x - draggedNode.position.x) < ALIGN_THRESHOLD) {
          matchX = n.position.x;
        }
        if (matchY === null && Math.abs(n.position.y - draggedNode.position.y) < ALIGN_THRESHOLD) {
          matchY = n.position.y;
        }
      }
      setGuideX(matchX);
      setGuideY(matchY);
    },
    [nodes]
  );

  const onNodeDragStop = useCallback(() => {
    setGuideX(null);
    setGuideY(null);
  }, []);

  // Reject connections a professional diagramming tool wouldn't allow: a
  // node wiring into itself (degenerate, zero-length floating edge), and an
  // exact duplicate of an existing connection (same source and target,
  // regardless of which handle was grabbed).
  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;
      return !edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
    },
    [edges]
  );

  const onConnectStart = useCallback(() => setIsConnecting(true), []);
  const onConnectEnd = useCallback(() => setIsConnecting(false), []);

  return (
    <div className="flex h-full w-full">
      <OnboardingModal />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        <TargetScaleBar />
        {appMode === "sandbox" && <LoadSimulator />}
        <MetricsHUD metrics={metrics} />
        <div
          ref={wrapperRef}
          id="sysforge-canvas-wrapper"
          className={`relative flex-1 ${isConnecting ? "cursor-crosshair" : ""}`}
        >
          <ReactFlow
            nodes={combinedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            connectionRadius={45}
            connectionLineComponent={FloatingConnectionLine}
            connectionLineStyle={{ stroke: "#38bdf8", strokeWidth: 2.5 }}
            isValidConnection={isValidConnection}
            defaultEdgeOptions={{ type: "floating" }}
            snapToGrid
            snapGrid={SNAP_GRID}
            onNodesChange={onCombinedNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onInit={(instance) => (rfInstance.current = instance)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onPaneClick={() => selectNode(null)}
            fitView
            className="bg-zinc-900"
          >
            <Background color="#3f3f46" gap={16} />
            <Controls />
            <MiniMap pannable zoomable className="!bg-zinc-950" style={{ width: 100, height: 75 }} />
          </ReactFlow>
          <AnnotationLayer />
          <AnnotationToolbar />
          {guideX !== null && (
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-sky-400/70"
              style={{ left: guideX * zoom + viewX }}
            />
          )}
          {guideY !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-10 h-px bg-sky-400/70"
              style={{ top: guideY * zoom + viewY }}
            />
          )}
          <div className="no-export absolute right-4 top-4 z-20">
            <ChaosMonkey />
          </div>
          <ChaosToast />
          <NodeInspector />
          <CritiquePanel nodes={nodes} edges={edges} metrics={metrics} />
          <GlossaryPanel />
          <EstimationDrills />
        </div>
      </div>
      {appMode === "guided" && level && (
        <GuidedPanel level={level} nodes={nodes} edges={edges} metrics={metrics} />
      )}
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

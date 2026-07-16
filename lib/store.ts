import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  MarkerType,
  Node,
  NodeChange,
} from "reactflow";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CloudProvider,
  COMPONENT_DEFAULTS,
  ComponentType,
  connectedNodeIds,
  evaluateConnection,
  getDisplayLabel,
  getVariant,
  SystemComponent,
} from "./engine";
import { DEFAULT_LEVEL_ID } from "./campaign";

export type SystemNodeType = Node<SystemComponent>;

export interface NoteData {
  text: string;
}
export type NoteNodeType = Node<NoteData>;

export type AppMode = "guided" | "sandbox";

export type DrawTool = "select" | "pen" | "arrow" | "eraser";

export interface Stroke {
  id: string;
  type: "pen" | "arrow";
  points: { x: number; y: number }[];
  color: string;
}

export const ANNOTATION_COLORS = ["#f8fafc", "#ef4444", "#facc15", "#38bdf8", "#4ade80"];

export interface ChaosEvent {
  message: string;
  key: number;
}

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

interface HistorySnapshot {
  nodes: SystemNodeType[];
  edges: Edge[];
  notes: NoteNodeType[];
  strokes: Stroke[];
}

const HISTORY_LIMIT = 50;

export interface SavedDesign {
  nodes: SystemNodeType[];
  edges: Edge[];
  notes: NoteNodeType[];
  strokes: Stroke[];
  savedAt: number;
}

interface SysForgeState {
  nodes: SystemNodeType[];
  edges: Edge[];
  notes: NoteNodeType[];
  strokes: Stroke[];
  selectedNodeId: string | null;
  provider: CloudProvider;
  simulateTraffic: boolean;
  appMode: AppMode;
  simulatedLoad: number | null;
  currentLevelId: string;
  savedDesigns: Record<string, SavedDesign>;
  bottleneckNodeId: string | null;
  saturatedNodeIds: string[];
  drawTool: DrawTool;
  drawColor: string;
  chaosEvent: ChaosEvent | null;
  mobileSidebarOpen: boolean;
  mobileGuidedPanelOpen: boolean;
  critiquePanelOpen: boolean;
  completedLevelIds: string[];
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNotesChange: (changes: NodeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: ComponentType, position: { x: number; y: number }) => void;
  addNote: (position: { x: number; y: number }) => void;
  updateNoteText: (noteId: string, text: string) => void;
  removeNote: (noteId: string) => void;
  removeNodes: (nodeIds: string[]) => void;
  removeEdges: (edgeIds: string[]) => void;
  addStroke: (stroke: Omit<Stroke, "id">) => void;
  removeStroke: (strokeId: string) => void;
  clearStrokes: () => void;
  setDrawTool: (tool: DrawTool) => void;
  setDrawColor: (color: string) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setMobileGuidedPanelOpen: (open: boolean) => void;
  setCritiquePanelOpen: (open: boolean) => void;
  markLevelComplete: (levelId: string) => void;
  killRandomNode: () => void;
  reviveAllNodes: () => void;
  resetGraph: () => void;
  selectNode: (nodeId: string | null) => void;
  updateNodeVariant: (nodeId: string, variantId: string) => void;
  updateNodeSecondaryVariant: (nodeId: string, optionId: string) => void;
  updateNodeConsistency: (nodeId: string, consistency: number) => void;
  updateNodeDegradation: (nodeId: string, degradation: number) => void;
  removeEdge: (edgeId: string) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  renameNode: (nodeId: string, label: string) => void;
  toggleEdgeSevered: (edgeId: string) => void;
  severRandomEdge: () => void;
  applyLayout: (positions: Record<string, { x: number; y: number }>) => void;
  setProvider: (provider: CloudProvider) => void;
  toggleSimulateTraffic: () => void;
  setAppMode: (mode: AppMode) => void;
  setSimulatedLoad: (load: number | null) => void;
  setCurrentLevelId: (levelId: string) => void;
  setLiveMetrics: (bottleneckNodeId: string | null, saturatedNodeIds: string[]) => void;
  saveDesignAs: (name: string) => void;
  loadDesign: (name: string) => void;
  deleteDesign: (name: string) => void;
  undo: () => void;
  redo: () => void;
}

// Deletion via keyboard (Backspace on a selection) fires onNodesChange AND
// onEdgesChange separately in the same synchronous tick for what is
// conceptually one user action -- dedupe so undo only needs one step.
let snapshotScheduled = false;

export const useSysForgeStore = create<SysForgeState>()(
  persist(
    (set, get) => {
      /** Snapshot current nodes/edges/notes onto the undo stack before a
       * discrete, structural mutation. Deliberately NOT called from
       * onNodesChange / onEdgesChange position updates so live drag
       * repositioning doesn't flood history with one entry per pixel --
       * only explicit actions (and remove changes) are undoable. */
      const snapshot = () => {
        const { nodes, edges, notes, strokes, past } = get();
        set({
          past: [...past, { nodes, edges, notes, strokes }].slice(-HISTORY_LIMIT),
          future: [],
        });
      };

      const snapshotOnce = () => {
        if (snapshotScheduled) return;
        snapshotScheduled = true;
        snapshot();
        queueMicrotask(() => {
          snapshotScheduled = false;
        });
      };

      return {
        nodes: [],
        edges: [],
        notes: [],
        strokes: [],
        selectedNodeId: null,
        provider: "generic",
        simulateTraffic: false,
        appMode: "guided",
        simulatedLoad: null,
        currentLevelId: DEFAULT_LEVEL_ID,
        savedDesigns: {},
        bottleneckNodeId: null,
        saturatedNodeIds: [],
        drawTool: "select",
        drawColor: ANNOTATION_COLORS[0],
        chaosEvent: null,
        mobileSidebarOpen: false,
        mobileGuidedPanelOpen: false,
        critiquePanelOpen: false,
        completedLevelIds: [],
        past: [],
        future: [],

        onNodesChange: (changes) => {
          if (changes.some((c) => c.type === "remove")) snapshotOnce();
          set({ nodes: applyNodeChanges(changes, get().nodes) });
        },

        onEdgesChange: (changes) => {
          if (changes.some((c) => c.type === "remove")) snapshotOnce();
          set({ edges: applyEdgeChanges(changes, get().edges) });
        },

        onNotesChange: (changes) => {
          if (changes.some((c) => c.type === "remove")) snapshotOnce();
          set({ notes: applyNodeChanges(changes, get().notes) as NoteNodeType[] });
        },

        onConnect: (connection) => {
          const { nodes, edges } = get();
          const source = nodes.find((n) => n.id === connection.source);
          const target = nodes.find((n) => n.id === connection.target);
          if (!source || !target) return;

          const evaluation = evaluateConnection(source.data.type, target.data.type);
          const colorByStatus: Record<string, string> = {
            optimal: "#22c55e",
            acceptable: "#3b82f6",
            warning: "#f59e0b",
            error: "#ef4444",
          };

          const newEdge: Edge = {
            ...connection,
            id: nextId("edge"),
            source: connection.source!,
            target: connection.target!,
            type: "floating",
            style: { stroke: colorByStatus[evaluation.status], strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: colorByStatus[evaluation.status] },
            data: { status: evaluation.status, message: evaluation.message, severed: false },
          };

          snapshot();
          set({ edges: addEdge(newEdge, edges) });
        },

        addNode: (type, position) => {
          const defaults = COMPONENT_DEFAULTS[type];
          const newNode: SystemNodeType = {
            id: nextId(type),
            type: "systemNode",
            position,
            data: { ...defaults, health: "healthy" },
          };
          snapshot();
          set({ nodes: [...get().nodes, newNode] });
        },

        addNote: (position) => {
          const newNote: NoteNodeType = {
            id: nextId("note"),
            type: "noteNode",
            position,
            data: { text: "" },
          };
          snapshot();
          set({ notes: [...get().notes, newNote] });
        },

        updateNoteText: (noteId, text) => {
          set({
            notes: get().notes.map((n) => (n.id === noteId ? { ...n, data: { text } } : n)),
          });
        },

        removeNote: (noteId) => {
          snapshot();
          set({ notes: get().notes.filter((n) => n.id !== noteId) });
        },

        removeNodes: (nodeIds) => {
          if (nodeIds.length === 0) return;
          const idSet = new Set(nodeIds);
          snapshotOnce();
          set({
            nodes: get().nodes.filter((n) => !idSet.has(n.id)),
            edges: get().edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)),
            selectedNodeId: idSet.has(get().selectedNodeId ?? "") ? null : get().selectedNodeId,
          });
        },

        removeEdges: (edgeIds) => {
          if (edgeIds.length === 0) return;
          const idSet = new Set(edgeIds);
          snapshotOnce();
          set({ edges: get().edges.filter((e) => !idSet.has(e.id)) });
        },

        addStroke: (stroke) => {
          snapshot();
          set({ strokes: [...get().strokes, { ...stroke, id: nextId("stroke") }] });
        },

        removeStroke: (strokeId) => {
          snapshot();
          set({ strokes: get().strokes.filter((s) => s.id !== strokeId) });
        },

        clearStrokes: () => {
          if (get().strokes.length === 0) return;
          snapshot();
          set({ strokes: [] });
        },

        setDrawTool: (tool) => set({ drawTool: tool }),

        setDrawColor: (color) => set({ drawColor: color }),

        setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

        setMobileGuidedPanelOpen: (open) => set({ mobileGuidedPanelOpen: open }),

        setCritiquePanelOpen: (open) => set({ critiquePanelOpen: open }),

        markLevelComplete: (levelId) => {
          if (get().completedLevelIds.includes(levelId)) return;
          set({ completedLevelIds: [...get().completedLevelIds, levelId] });
        },

        killRandomNode: () => {
          const { nodes, edges, provider } = get();
          const connectedIds = connectedNodeIds(edges);
          const candidates = nodes.filter(
            (n) => n.data.health !== "dead" && n.data.type !== "client" && connectedIds.has(n.id)
          );
          if (candidates.length === 0) {
            set({
              chaosEvent: {
                message: "No connected, healthy components left to kill",
                key: Date.now(),
              },
            });
            return;
          }
          const victim = candidates[Math.floor(Math.random() * candidates.length)];
          const label =
            victim.data.customLabel || getDisplayLabel(victim.data.type, victim.data.variant, provider);
          snapshot();
          set({
            nodes: nodes.map((n) =>
              n.id === victim.id ? { ...n, data: { ...n.data, health: "dead" } } : n
            ),
            chaosEvent: { message: `💀 Killed: ${label}`, key: Date.now() },
          });
        },

        reviveAllNodes: () => {
          const { nodes, edges } = get();
          const deadCount = nodes.filter((n) => n.data.health === "dead").length;
          const severedCount = edges.filter((e) => e.data?.severed).length;
          if (deadCount === 0 && severedCount === 0) {
            set({ chaosEvent: { message: "Nothing to revive -- everything is already healthy", key: Date.now() } });
            return;
          }
          snapshot();
          set({
            nodes: nodes.map((n) => ({ ...n, data: { ...n.data, health: "healthy" } })),
            edges: edges.map((e) =>
              e.data?.severed ? { ...e, data: { ...e.data, severed: false } } : e
            ),
            chaosEvent: {
              message: `✅ Revived ${deadCount} node${deadCount === 1 ? "" : "s"} and healed ${severedCount} connection${severedCount === 1 ? "" : "s"}`,
              key: Date.now(),
            },
          });
        },

        resetGraph: () => {
          snapshot();
          set({ nodes: [], edges: [], notes: [], strokes: [] });
        },

        selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

        updateNodeVariant: (nodeId, variantId) => {
          snapshot();
          set({
            nodes: get().nodes.map((n) => {
              if (n.id !== nodeId) return n;
              const variant = getVariant(n.data.type, variantId);
              return {
                ...n,
                data: {
                  ...n.data,
                  variant: variant.id,
                  label: variant.label,
                  maxRps: variant.maxRps,
                  latencyMs: variant.latencyMs,
                  costPerMonth: variant.costPerMonth,
                },
              };
            }),
          });
        },

        updateNodeSecondaryVariant: (nodeId, optionId) => {
          snapshot();
          set({
            nodes: get().nodes.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, secondaryVariant: optionId } } : n
            ),
          });
        },

        updateNodeConsistency: (nodeId, consistency) => {
          snapshot();
          set({
            nodes: get().nodes.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, consistency } } : n
            ),
          });
        },

        updateNodeDegradation: (nodeId, degradation) => {
          snapshot();
          set({
            nodes: get().nodes.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, degradation } } : n
            ),
          });
        },

        removeEdge: (edgeId) => {
          snapshot();
          set({ edges: get().edges.filter((e) => e.id !== edgeId) });
        },

        removeNode: (nodeId) => {
          snapshot();
          set({
            nodes: get().nodes.filter((n) => n.id !== nodeId),
            edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
            selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
          });
        },

        duplicateNode: (nodeId) => {
          const node = get().nodes.find((n) => n.id === nodeId);
          if (!node) return;
          const newNode: SystemNodeType = {
            ...node,
            id: nextId(node.data.type),
            position: { x: node.position.x + 48, y: node.position.y + 48 },
            selected: false,
            data: { ...node.data },
          };
          snapshot();
          set({ nodes: [...get().nodes, newNode], selectedNodeId: newNode.id });
        },

        renameNode: (nodeId, label) => {
          snapshot();
          set({
            nodes: get().nodes.map((n) =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, customLabel: label.trim() || undefined } }
                : n
            ),
          });
        },

        toggleEdgeSevered: (edgeId) => {
          snapshot();
          set({
            edges: get().edges.map((e) =>
              e.id === edgeId ? { ...e, data: { ...e.data, severed: !e.data?.severed } } : e
            ),
          });
        },

        severRandomEdge: () => {
          const { edges, nodes, provider } = get();
          const candidates = edges.filter((e) => !e.data?.severed);
          if (candidates.length === 0) {
            set({ chaosEvent: { message: "No connections left to sever", key: Date.now() } });
            return;
          }
          const victim = candidates[Math.floor(Math.random() * candidates.length)];
          const labelFor = (nodeId: string) => {
            const n = nodes.find((node) => node.id === nodeId);
            if (!n) return "?";
            return n.data.customLabel || getDisplayLabel(n.data.type, n.data.variant, provider);
          };
          snapshot();
          set({
            edges: edges.map((e) =>
              e.id === victim.id ? { ...e, data: { ...e.data, severed: true } } : e
            ),
            chaosEvent: {
              message: `🔌 Severed: ${labelFor(victim.source)} → ${labelFor(victim.target)}`,
              key: Date.now(),
            },
          });
        },

        applyLayout: (positions) => {
          snapshot();
          set({
            nodes: get().nodes.map((n) =>
              positions[n.id] ? { ...n, position: positions[n.id] } : n
            ),
          });
        },

        setProvider: (provider) => set({ provider }),

        toggleSimulateTraffic: () => set({ simulateTraffic: !get().simulateTraffic }),

        setAppMode: (mode) => set({ appMode: mode, simulatedLoad: mode === "sandbox" ? get().simulatedLoad : null }),

        setSimulatedLoad: (load) => set({ simulatedLoad: load }),

        setCurrentLevelId: (levelId) => set({ currentLevelId: levelId }),

        setLiveMetrics: (bottleneckNodeId, saturatedNodeIds) =>
          set({ bottleneckNodeId, saturatedNodeIds }),

        saveDesignAs: (name) => {
          const trimmed = name.trim();
          if (!trimmed) return;
          const { nodes, edges, notes, strokes, savedDesigns } = get();
          set({
            savedDesigns: {
              ...savedDesigns,
              [trimmed]: { nodes, edges, notes, strokes, savedAt: Date.now() },
            },
          });
        },

        loadDesign: (name) => {
          const design = get().savedDesigns[name];
          if (!design) return;
          snapshot();
          set({
            nodes: design.nodes,
            edges: design.edges,
            notes: design.notes ?? [],
            strokes: design.strokes ?? [],
            selectedNodeId: null,
          });
        },

        deleteDesign: (name) => {
          const { [name]: _removed, ...rest } = get().savedDesigns;
          set({ savedDesigns: rest });
        },

        undo: () => {
          const { past, nodes, edges, notes, strokes, future } = get();
          if (past.length === 0) return;
          const previous = past[past.length - 1];
          set({
            nodes: previous.nodes,
            edges: previous.edges,
            notes: previous.notes,
            strokes: previous.strokes,
            past: past.slice(0, -1),
            future: [{ nodes, edges, notes, strokes }, ...future].slice(0, HISTORY_LIMIT),
            selectedNodeId: null,
          });
        },

        redo: () => {
          const { future, nodes, edges, notes, strokes, past } = get();
          if (future.length === 0) return;
          const next = future[0];
          set({
            nodes: next.nodes,
            edges: next.edges,
            notes: next.notes,
            strokes: next.strokes,
            future: future.slice(1),
            past: [...past, { nodes, edges, notes, strokes }].slice(-HISTORY_LIMIT),
            selectedNodeId: null,
          });
        },
      };
    },
    {
      name: "sysforge-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        notes: state.notes,
        strokes: state.strokes,
        provider: state.provider,
        appMode: state.appMode,
        currentLevelId: state.currentLevelId,
        savedDesigns: state.savedDesigns,
        completedLevelIds: state.completedLevelIds,
      }),
    }
  )
);

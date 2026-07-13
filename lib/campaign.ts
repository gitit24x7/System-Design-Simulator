// Guided campaign: level definitions and objective validation.

import { calculateSystemMetrics, ComponentType, GraphEdge, GraphNode, SystemMetrics } from "./engine";

export interface Objective {
  id: string;
  description: string;
  check: (nodes: GraphNode[], edges: GraphEdge[], metrics: SystemMetrics) => boolean;
}

export interface Requirements {
  functional: string[];
  nonFunctional: string[];
}

export interface Level {
  id: string;
  title: string;
  scenario: string;
  requirements: Requirements;
  objectives: Objective[];
}

function hasComponent(nodes: GraphNode[], type: ComponentType): boolean {
  return nodes.some((n) => n.data.type === type && n.data.health !== "dead");
}

function countComponent(nodes: GraphNode[], type: ComponentType): number {
  return nodes.filter((n) => n.data.type === type && n.data.health !== "dead").length;
}

function isConnected(edges: GraphEdge[], nodes: GraphNode[], from: ComponentType, to: ComponentType): boolean {
  const nodeType = (id: string) => nodes.find((n) => n.id === id)?.data.type;
  return edges.some((e) => nodeType(e.source) === from && nodeType(e.target) === to);
}

// True once at least one connection exists and none of them are flagged as
// anti-patterns by the rules engine (evaluateConnection).
function noBadConnections(edges: GraphEdge[]): boolean {
  if (edges.length === 0) return false;
  return edges.every((e) => e.data?.status === "optimal" || e.data?.status === "acceptable");
}

// A design "survives" if killing any single non-client node still leaves the
// system serving at least minRps -- i.e. there's no single point of failure.
function survivesAnySingleFailure(nodes: GraphNode[], edges: GraphEdge[], minRps: number): boolean {
  const candidates = nodes.filter((n) => n.data.type !== "client" && n.data.health !== "dead");
  if (candidates.length === 0) return false;
  return candidates.every((victim) => {
    const simulatedNodes = nodes.map((n) =>
      n.id === victim.id ? { ...n, data: { ...n.data, health: "dead" as const } } : n
    );
    return calculateSystemMetrics(simulatedNodes, edges).rps >= minRps;
  });
}

export const LEVELS: Level[] = [
  {
    id: "level-1-url-shortener",
    title: "Level 1: URL Shortener",
    scenario:
      "Build the simplest possible service: a client hits an API which reads/writes a database. Keep it simple and keep it up.",
    requirements: {
      functional: [
        "Users can submit a long URL and receive a short one",
        "Visiting the short URL redirects to the original long URL",
      ],
      nonFunctional: [
        "Handle at least 500 redirects/sec",
        "99% availability",
        "Keep it as cheap and simple as possible -- this is not a scale problem yet",
      ],
    },
    objectives: [
      {
        id: "add-client",
        description: "Add a Client",
        check: (nodes) => hasComponent(nodes, "client"),
      },
      {
        id: "add-api",
        description: "Add an API Server",
        check: (nodes) => hasComponent(nodes, "api"),
      },
      {
        id: "add-database",
        description: "Add a Database",
        check: (nodes) => hasComponent(nodes, "database"),
      },
      {
        id: "connect-client-api",
        description: "Connect Client -> API",
        check: (nodes, edges) => isConnected(edges, nodes, "client", "api"),
      },
      {
        id: "connect-api-database",
        description: "Connect API -> Database",
        check: (nodes, edges) => isConnected(edges, nodes, "api", "database"),
      },
      {
        id: "throughput",
        description: "Reach at least 500 RPS throughput",
        check: (_n, _e, metrics) => metrics.rps >= 500,
      },
      {
        id: "availability",
        description: "Keep availability above 99%",
        check: (_n, _e, metrics) => metrics.availabilityPct >= 99,
      },
    ],
  },
  {
    id: "level-2-scaling-reads",
    title: "Level 2: Scaling Reads",
    scenario:
      "A Twitter-style feed: reads vastly outnumber writes. One database won't keep up with read traffic alone -- put a cache in front of it.",
    requirements: {
      functional: [
        "Users can post a short update",
        "Users can view a feed of recent updates",
      ],
      nonFunctional: [
        "Handle at least 5,000 read requests/sec",
        "Keep latency under 50ms",
        "99% availability",
      ],
    },
    objectives: [
      { id: "add-client", description: "Add a Client", check: (nodes) => hasComponent(nodes, "client") },
      { id: "add-api", description: "Add an API Server", check: (nodes) => hasComponent(nodes, "api") },
      { id: "add-cache", description: "Add a Cache", check: (nodes) => hasComponent(nodes, "cache") },
      { id: "add-database", description: "Add a Database", check: (nodes) => hasComponent(nodes, "database") },
      {
        id: "connect-client-api",
        description: "Connect Client -> API",
        check: (nodes, edges) => isConnected(edges, nodes, "client", "api"),
      },
      {
        id: "connect-api-cache",
        description: "Connect API -> Cache",
        check: (nodes, edges) => isConnected(edges, nodes, "api", "cache"),
      },
      {
        id: "connect-api-database",
        description: "Connect API -> Database",
        check: (nodes, edges) => isConnected(edges, nodes, "api", "database"),
      },
      {
        id: "throughput",
        description: "Reach at least 5,000 RPS throughput",
        check: (_n, _e, metrics) => metrics.rps >= 5000,
      },
      {
        id: "latency",
        description: "Keep latency under 50ms",
        check: (_n, _e, metrics) => metrics.latencyMs > 0 && metrics.latencyMs <= 50,
      },
      {
        id: "availability",
        description: "Keep availability above 99%",
        check: (_n, _e, metrics) => metrics.availabilityPct >= 99,
      },
    ],
  },
  {
    id: "level-3-decoupling",
    title: "Level 3: Decoupling with Queues",
    scenario:
      "An Uber-style ride match: the API must accept a request instantly, while the actual matching work happens in the background. Don't make the client wait on slow work.",
    requirements: {
      functional: [
        "The API accepts a ride request immediately",
        "Matching happens asynchronously without blocking the response",
      ],
      nonFunctional: [
        "Handle at least 2,000 incoming requests/sec",
        "99% availability",
        "No anti-pattern connections (e.g. API calling a worker directly, bypassing the queue)",
      ],
    },
    objectives: [
      { id: "add-client", description: "Add a Client", check: (nodes) => hasComponent(nodes, "client") },
      { id: "add-api", description: "Add an API Server", check: (nodes) => hasComponent(nodes, "api") },
      { id: "add-queue", description: "Add a Queue", check: (nodes) => hasComponent(nodes, "queue") },
      { id: "add-worker", description: "Add a Worker", check: (nodes) => hasComponent(nodes, "worker") },
      { id: "add-database", description: "Add a Database", check: (nodes) => hasComponent(nodes, "database") },
      {
        id: "connect-client-api",
        description: "Connect Client -> API",
        check: (nodes, edges) => isConnected(edges, nodes, "client", "api"),
      },
      {
        id: "connect-api-queue",
        description: "Connect API -> Queue (don't call the worker directly)",
        check: (nodes, edges) => isConnected(edges, nodes, "api", "queue"),
      },
      {
        id: "connect-queue-worker",
        description: "Connect Queue -> Worker",
        check: (nodes, edges) => isConnected(edges, nodes, "queue", "worker"),
      },
      {
        id: "connect-worker-database",
        description: "Connect Worker -> Database",
        check: (nodes, edges) => isConnected(edges, nodes, "worker", "database"),
      },
      {
        id: "throughput",
        description: "Reach at least 2,000 RPS throughput",
        check: (_n, _e, metrics) => metrics.rps >= 2000,
      },
      {
        id: "no-bad-connections",
        description: "No anti-pattern connections in the design",
        check: (_n, edges) => noBadConnections(edges),
      },
      {
        id: "availability",
        description: "Keep availability above 99%",
        check: (_n, _e, metrics) => metrics.availabilityPct >= 99,
      },
    ],
  },
  {
    id: "level-4-distributed-data",
    title: "Level 4: Distributed Data",
    scenario:
      "A YouTube-style platform serving media globally at massive read scale. One API instance can't handle this alone -- push static content to the edge and scale horizontally behind a load balancer.",
    requirements: {
      functional: [
        "Users can upload media (processed asynchronously)",
        "Users can stream media with low latency from anywhere in the world",
      ],
      nonFunctional: [
        "Handle at least 10,000 requests/sec",
        "99.9% availability",
        "No single API instance -- scale horizontally",
      ],
    },
    objectives: [
      { id: "add-client", description: "Add a Client", check: (nodes) => hasComponent(nodes, "client") },
      { id: "add-cdn", description: "Add a CDN", check: (nodes) => hasComponent(nodes, "cdn") },
      {
        id: "add-load-balancer",
        description: "Add a Load Balancer",
        check: (nodes) => hasComponent(nodes, "load-balancer"),
      },
      {
        id: "add-two-apis",
        description: "Add at least 2 API replicas (no single instance)",
        check: (nodes) => countComponent(nodes, "api") >= 2,
      },
      { id: "add-database", description: "Add a Database", check: (nodes) => hasComponent(nodes, "database") },
      {
        id: "connect-client-cdn",
        description: "Connect Client -> CDN",
        check: (nodes, edges) => isConnected(edges, nodes, "client", "cdn"),
      },
      {
        id: "connect-cdn-lb",
        description: "Connect CDN -> Load Balancer",
        check: (nodes, edges) => isConnected(edges, nodes, "cdn", "load-balancer"),
      },
      {
        id: "connect-lb-api",
        description: "Connect Load Balancer -> API",
        check: (nodes, edges) => isConnected(edges, nodes, "load-balancer", "api"),
      },
      {
        id: "connect-api-database",
        description: "Connect API -> Database",
        check: (nodes, edges) => isConnected(edges, nodes, "api", "database"),
      },
      {
        id: "throughput",
        description: "Reach at least 10,000 RPS throughput",
        check: (_n, _e, metrics) => metrics.rps >= 10000,
      },
      {
        id: "availability",
        description: "Keep availability above 99.9%",
        check: (_n, _e, metrics) => metrics.availabilityPct >= 99.9,
      },
    ],
  },
  {
    id: "level-5-high-availability",
    title: "Level 5: High Availability",
    scenario:
      "An e-commerce checkout during a Black Friday sale. Infrastructure WILL fail under peak load -- your design must keep serving traffic even when any single component goes down.",
    requirements: {
      functional: ["Users can browse products and complete checkout"],
      nonFunctional: [
        "Handle at least 3,000 requests/sec",
        "99.9% availability",
        "No single point of failure -- the system must survive any one component failing",
      ],
    },
    objectives: [
      { id: "add-client", description: "Add a Client", check: (nodes) => hasComponent(nodes, "client") },
      {
        id: "add-load-balancer",
        description: "Add a Load Balancer",
        check: (nodes) => hasComponent(nodes, "load-balancer"),
      },
      {
        id: "add-two-apis",
        description: "Add at least 2 API replicas",
        check: (nodes) => countComponent(nodes, "api") >= 2,
      },
      {
        id: "add-database-replica",
        description: "Add a Database with a Read Replica",
        check: (nodes) => nodes.some((n) => n.data.type === "database" && n.data.variant === "read-replica"),
      },
      {
        id: "connect-client-lb",
        description: "Connect Client -> Load Balancer",
        check: (nodes, edges) => isConnected(edges, nodes, "client", "load-balancer"),
      },
      {
        id: "connect-lb-api",
        description: "Connect Load Balancer -> API",
        check: (nodes, edges) => isConnected(edges, nodes, "load-balancer", "api"),
      },
      {
        id: "connect-api-database",
        description: "Connect API -> Database",
        check: (nodes, edges) => isConnected(edges, nodes, "api", "database"),
      },
      {
        id: "throughput",
        description: "Reach at least 3,000 RPS throughput",
        check: (_n, _e, metrics) => metrics.rps >= 3000,
      },
      {
        id: "no-spof",
        description: "Survive any single component failing (no SPOF)",
        check: (nodes, edges, metrics) =>
          metrics.rps >= 3000 && survivesAnySingleFailure(nodes, edges, 3000),
      },
      {
        id: "availability",
        description: "Keep availability above 99.9%",
        check: (_n, _e, metrics) => metrics.availabilityPct >= 99.9,
      },
    ],
  },
];

export function getLevel(levelId: string): Level | undefined {
  return LEVELS.find((l) => l.id === levelId);
}

export interface LevelProgress {
  objectiveId: string;
  description: string;
  completed: boolean;
}

export interface LevelValidation {
  progress: LevelProgress[];
  allComplete: boolean;
}

export function validateLevel(
  level: Level,
  nodes: GraphNode[],
  edges: GraphEdge[],
  metrics: SystemMetrics
): LevelValidation {
  const progress = level.objectives.map((objective) => ({
    objectiveId: objective.id,
    description: objective.description,
    completed: objective.check(nodes, edges, metrics),
  }));

  return { progress, allComplete: progress.every((p) => p.completed) };
}

// Guided campaign: project + level definitions and objective validation.
//
// The campaign is organized as 20 independent project scenarios (the kind of
// prompt you'd get in a system design interview). Each project has exactly
// three levels -- Easy, Medium, Hard -- that revisit the same scenario with
// escalating requirements, so the player sees how a design has to evolve as
// scale and reliability demands grow.

import { calculateSystemMetrics, ComponentType, GraphEdge, GraphNode, SystemMetrics } from "./engine";

export type Difficulty = "easy" | "medium" | "hard";

export interface Objective {
  id: string;
  description: string;
  /** A 1-2 sentence explanation of why this objective matters, shown under the checklist item. */
  why: string;
  check: (nodes: GraphNode[], edges: GraphEdge[], metrics: SystemMetrics) => boolean;
}

export interface Requirements {
  functional: string[];
  nonFunctional: string[];
}

export interface Level {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  difficulty: Difficulty;
  scenario: string;
  requirements: Requirements;
  objectives: Objective[];
}

type RawLevel = Omit<Level, "id" | "projectId" | "projectTitle">;

export interface Project {
  id: string;
  title: string;
  summary: string;
  levels: RawLevel[];
}

function hasComponent(nodes: GraphNode[], type: ComponentType): boolean {
  return nodes.some((n) => n.data.type === type && n.data.health !== "dead");
}

function countComponent(nodes: GraphNode[], type: ComponentType): number {
  return nodes.filter((n) => n.data.type === type && n.data.health !== "dead").length;
}

function hasVariant(nodes: GraphNode[], type: ComponentType, variantId: string): boolean {
  return nodes.some((n) => n.data.type === type && n.data.health !== "dead" && n.data.variant === variantId);
}

function hasSecondaryVariant(nodes: GraphNode[], type: ComponentType, optionId: string): boolean {
  return nodes.some(
    (n) => n.data.type === type && n.data.health !== "dead" && n.data.secondaryVariant === optionId
  );
}

function hasConsistencyAtLeast(nodes: GraphNode[], min: number): boolean {
  return nodes.some((n) => n.data.type === "database" && n.data.health !== "dead" && n.data.consistency >= min);
}

function isConnected(edges: GraphEdge[], nodes: GraphNode[], from: ComponentType, to: ComponentType): boolean {
  const nodeType = (id: string) => nodes.find((n) => n.id === id)?.data.type;
  return edges.some((e) => nodeType(e.source) === from && nodeType(e.target) === to);
}

// Counts distinct target nodes of type `to` that a node of type `from`
// fans out to -- used for "connect to at least N workers" style objectives.
function connectedTargetCount(edges: GraphEdge[], nodes: GraphNode[], from: ComponentType, to: ComponentType): number {
  const nodeType = (id: string) => nodes.find((n) => n.id === id)?.data.type;
  const targets = new Set(
    edges.filter((e) => nodeType(e.source) === from && nodeType(e.target) === to).map((e) => e.target)
  );
  return targets.size;
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

// ---------------------------------------------------------------------------
// Shared objective builders. Every level below is one of a handful of proven
// topology "shapes" (chain, cache-fronted, CDN-fronted, queue/worker,
// gateway, fan-out broker, load-balanced, HA-with-replica, budget-capped)
// applied to a different scenario. These builders keep the objective wiring
// consistent -- and its throughput math already validated -- while each
// project supplies its own flavor text.
// ---------------------------------------------------------------------------

// Short "why does this matter" explanations, keyed so they stay consistent
// everywhere a given component/connection/metric shows up across the 60
// levels, instead of being hand-written 400+ times.
const WHY_ADD: Partial<Record<ComponentType, string>> = {
  client: "Represents real user traffic hitting your system -- every design starts here.",
  cdn: "Caches static content at edge locations near users, cutting latency and offloading your origin servers.",
  "load-balancer": "Spreads traffic across multiple API instances so no single server has to take the full load.",
  "api-gateway": "Gives external clients one stable entry point that can handle auth, rate limiting, and routing.",
  api: "Runs your business logic and mediates every request between clients and your data layer.",
  cache: "Serves hot reads from memory instead of hitting the database every time, cutting load and latency.",
  database: "Persists the data your system actually needs to remember between requests.",
  "object-storage": "Holds large binary files (images, video, uploads) cheaply and durably -- far better than stuffing them into a database.",
  queue: "Buffers work so a slow background job never blocks the request that triggered it.",
  "message-broker": "Publishes one event to many independent consumers, so each can process it on its own schedule.",
  worker: "Runs slow or async work off the request path, so the API can respond immediately.",
};

const WHY_CONNECT: Record<string, string> = {
  "client-api": "The most direct path from user to logic -- fine for a single instance, but that instance becomes a single point of failure.",
  "client-cdn": "Static requests get served from the edge before ever reaching your servers.",
  "client-load-balancer": "The load balancer becomes the single entry point that decides which API instance handles each request.",
  "client-api-gateway": "Every client request passes through the gateway first, where auth and rate limiting happen once, centrally.",
  "cdn-api": "Whatever the CDN doesn't have cached falls through to your origin API.",
  "cdn-load-balancer": "The CDN forwards cache misses to a load-balanced fleet instead of one origin server.",
  "cdn-api-gateway": "The CDN forwards cache misses to the gateway, which still enforces auth and rate limits on the way through.",
  "api-gateway-api": "The gateway routes authenticated, already-rate-limited traffic on to your actual services.",
  "api-gateway-load-balancer": "The gateway hands off to a load-balanced fleet so the API tier itself can scale horizontally.",
  "load-balancer-api": "Requests get spread across every healthy API instance instead of overloading one.",
  "api-cache": "Reads get served from memory first, so only cache misses ever reach the database.",
  "api-database": "The API's primary read/write path to persisted data.",
  "api-object-storage": "Large files go straight to blob storage instead of bloating your relational database.",
  "api-queue": "The API hands off slow work and returns a response immediately, instead of making the client wait.",
  "queue-worker": "Workers pull jobs off the queue at their own pace, smoothing out traffic spikes.",
  "worker-database": "The background job persists its result once the slow work is done.",
  "api-message-broker": "The API publishes one event, and every interested consumer picks it up independently.",
  "message-broker-worker": "Each worker processes the same event on its own, so a slow consumer never blocks the others.",
};

function whyForConnect(from: ComponentType, to: ComponentType): string {
  return WHY_CONNECT[`${from}-${to}`] ?? `Wires ${from} into the request path so it can actually do its job.`;
}

function addObjective(type: ComponentType, label: string): Objective {
  return {
    id: `add-${type}`,
    description: `Add ${label}`,
    why: WHY_ADD[type] ?? `${label} is required for this design.`,
    check: (nodes) => hasComponent(nodes, type),
  };
}

function connectObjective(from: ComponentType, to: ComponentType, fromLabel: string, toLabel: string, note?: string): Objective {
  return {
    id: `connect-${from}-${to}`,
    description: `Connect ${fromLabel} -> ${toLabel}${note ? ` (${note})` : ""}`,
    why: whyForConnect(from, to),
    check: (nodes, edges) => isConnected(edges, nodes, from, to),
  };
}

function throughputObjective(min: number): Objective {
  return {
    id: "throughput",
    description: `Reach at least ${min.toLocaleString()} RPS throughput`,
    why: "This is the real, computed capacity of your graph -- if a node upstream is undersized, no amount of wiring will get you here.",
    check: (_n, _e, metrics) => metrics.rps >= min,
  };
}

function availabilityObjective(min: number): Objective {
  return {
    id: "availability",
    description: `Keep availability above ${min}%`,
    why: "Every dead node and every point of strong consistency chips away at this number -- it's the cost of your reliability choices, made visible.",
    check: (_n, _e, metrics) => metrics.availabilityPct >= min,
  };
}

function latencyObjective(max: number): Objective {
  return {
    id: "latency",
    description: `Keep latency under ${max}ms`,
    why: "Measured along the slowest path through your graph -- extra hops and heavier components both add up.",
    check: (_n, _e, metrics) => metrics.latencyMs > 0 && metrics.latencyMs <= max,
  };
}

function budgetObjective(max: number): Objective {
  return {
    id: "budget",
    description: `Keep monthly cost at or under $${max}`,
    why: "Real infrastructure isn't free -- the goal is redundancy and scale where it counts, not everywhere.",
    check: (_n, _e, metrics) => metrics.costPerMonth <= max,
  };
}

function noSpofObjective(minRps: number): Objective {
  return {
    id: "no-spof",
    description: "Survive any single component failing (no SPOF)",
    why: "Simulates killing each component one at a time -- if throughput collapses when any single one dies, that component is a single point of failure.",
    check: (nodes, edges, metrics) => metrics.rps >= minRps && survivesAnySingleFailure(nodes, edges, minRps),
  };
}

const twoApiReplicasObjective: Objective = {
  id: "add-two-apis",
  description: "Add at least 2 API replicas",
  why: "One instance is a single point of failure and a hard capacity ceiling -- more replicas mean more combined throughput and no single server taking down the whole tier.",
  check: (nodes) => countComponent(nodes, "api") >= 2,
};

const threeApiReplicasObjective: Objective = {
  id: "add-three-apis",
  description: "Add at least 3 API replicas",
  why: "More replicas raise your combined capacity ceiling and mean losing any one instance costs you less of your total throughput.",
  check: (nodes) => countComponent(nodes, "api") >= 3,
};

function threeWorkersObjective(note: string): Objective {
  return {
    id: "add-three-workers",
    description: `Add at least 3 Workers (${note})`,
    why: "Each worker is a separate, independent consumer -- one being slow or down shouldn't hold up the others.",
    check: (nodes) => countComponent(nodes, "worker") >= 3,
  };
}

function fanOutObjective(from: ComponentType, fromLabel: string): Objective {
  return {
    id: "fan-out",
    description: `Fan ${fromLabel} out to at least 3 independent Workers`,
    why: "This is the actual fan-out pattern: one event published once, delivered to every consumer independently.",
    check: (nodes, edges) => connectedTargetCount(edges, nodes, from, "worker") >= 3,
  };
}

const databaseReplicaObjective: Objective = {
  id: "add-database-replica",
  description: "Add a Database with a Read Replica",
  why: "A single database instance is both a capacity ceiling and a single point of failure -- a read replica raises the ceiling and gives you somewhere to fail over to.",
  check: (nodes) => hasVariant(nodes, "database", "read-replica"),
};

function useNoSqlObjective(): Objective {
  return {
    id: "use-nosql",
    description: "Configure the Database's Engine as NoSQL",
    why: "NoSQL trades relational guarantees for a flexible schema and higher write throughput -- the right call when your data shape keeps changing.",
    check: (nodes) => hasSecondaryVariant(nodes, "database", "nosql"),
  };
}

function strongConsistencyObjective(min = 80): Objective {
  return {
    id: "strong-consistency",
    description: `Dial the Database's CAP Consistency to at least ${min} (Strong)`,
    why: "CAP theorem in practice: dialing toward strong consistency guarantees every read sees the latest write, but it costs you some availability.",
    check: (nodes) => hasConsistencyAtLeast(nodes, min),
  };
}

const noBadConnectionsObjective: Objective = {
  id: "no-bad-connections",
  description: "No anti-pattern connections in the design",
  why: "Some connections (like an API calling a worker directly) work but skip the benefits the pattern is supposed to give you -- the rules engine flags them.",
  check: (_n, edges) => noBadConnections(edges),
};

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const PROJECTS: Project[] = [
  {
    id: "url-shortener",
    title: "URL Shortener",
    summary: "A link-shortening service, from a basic redirect to viral-scale traffic.",
    levels: [
      {
        title: "Basic Redirect Service",
        difficulty: "easy",
        scenario: "Build the simplest possible version: an API that shortens a URL and redirects visitors to the original.",
        requirements: {
          functional: ["Users can submit a long URL and receive a short one", "Visiting the short URL redirects to the original"],
          nonFunctional: ["Handle at least 500 redirects/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Redirects Under Load",
        difficulty: "medium",
        scenario: "Popular links get hammered with redirect traffic. Reads vastly outnumber writes -- shield the database with a cache.",
        requirements: {
          functional: ["Users can submit a long URL and receive a short one", "Redirects stay fast even for popular links"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(1800),
          availabilityObjective(97),
        ],
      },
      {
        title: "Viral Link Scale",
        difficulty: "hard",
        scenario: "A link just went viral. One API instance can't take the load -- scale horizontally behind a load balancer.",
        requirements: {
          functional: ["Redirects keep working under a massive traffic spike"],
          nonFunctional: ["Handle at least 3,500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(3500),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "social-feed",
    title: "Social Feed",
    summary: "A Twitter-style feed: post updates, scroll a timeline, and survive going mainstream.",
    levels: [
      {
        title: "Post and Read",
        difficulty: "easy",
        scenario: "Users can post a short update and see a feed of recent posts. Nothing fancy yet.",
        requirements: {
          functional: ["Users can post a short update", "Users can view a feed of recent posts"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Reads Vastly Outnumber Writes",
        difficulty: "medium",
        scenario: "Most users are scrolling, not posting. A single database can't keep up with feed reads alone.",
        requirements: {
          functional: ["Users can post a short update", "Users can view a feed of recent posts"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "Keep latency under 50ms", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(1800),
          latencyObjective(50),
          availabilityObjective(97),
        ],
      },
      {
        title: "Going Mainstream",
        difficulty: "hard",
        scenario: "You've been featured in the app store. Traffic is 10x overnight -- scale the API tier horizontally.",
        requirements: {
          functional: ["The feed stays responsive during a traffic surge"],
          nonFunctional: ["Handle at least 3,800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(3800),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "photo-sharing",
    title: "Photo Sharing",
    summary: "An Instagram-style app: upload photos, store them durably, and serve them at scale.",
    levels: [
      {
        title: "Upload and View",
        difficulty: "easy",
        scenario: "Users can upload a photo and view photos others have shared.",
        requirements: {
          functional: ["Users can upload a photo", "Users can view photos"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Blobs Don't Belong in a Database",
        difficulty: "medium",
        scenario: "Storing photo bytes in the relational database is expensive and slow. Move them to dedicated object storage.",
        requirements: {
          functional: ["Users can upload a photo", "Users can view photos others have shared"],
          nonFunctional: ["Handle at least 1,500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("object-storage", "Object Storage"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "object-storage", "API", "Object Storage", "photo bytes"),
          connectObjective("api", "database", "API", "Database", "photo metadata"),
          throughputObjective(1500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Media at Scale",
        difficulty: "hard",
        scenario: "You're the next big photo app. Scale the API tier, shield the database with a cache, and pick a database engine that handles high write volume.",
        requirements: {
          functional: ["Uploads and feed browsing both stay fast at scale"],
          nonFunctional: ["Handle at least 5,000 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          threeApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("object-storage", "Object Storage"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "object-storage", "API", "Object Storage"),
          connectObjective("api", "database", "API", "Database"),
          useNoSqlObjective(),
          throughputObjective(5000),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "ride-matching",
    title: "Ride Matching",
    summary: "An Uber-style ride match: accept requests instantly, match asynchronously, notify everyone involved.",
    levels: [
      {
        title: "Request a Ride",
        difficulty: "easy",
        scenario: "A rider requests a ride and the API records it.",
        requirements: {
          functional: ["Riders can request a ride"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Match Asynchronously",
        difficulty: "medium",
        scenario: "The API must accept a ride request instantly while matching happens in the background. Don't make the rider wait on slow work.",
        requirements: {
          functional: ["The API accepts a ride request immediately", "Matching happens asynchronously"],
          nonFunctional: ["Handle at least 900 requests/sec", "97% availability", "No anti-pattern connections"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("queue", "a Queue"),
          addObjective("worker", "a Worker"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "queue", "API", "Queue", "don't call the worker directly"),
          connectObjective("queue", "worker", "Queue", "Worker"),
          connectObjective("worker", "database", "Worker", "Database"),
          noBadConnectionsObjective,
          throughputObjective(900),
          availabilityObjective(97),
        ],
      },
      {
        title: "Notify Everyone Involved",
        difficulty: "hard",
        scenario: "Once matched, the rider, the driver, and your analytics pipeline all need to know -- independently, without one slow consumer blocking the others.",
        requirements: {
          functional: ["A successful match notifies the rider, the driver, and analytics independently"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("rider, driver, analytics"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(1800),
          availabilityObjective(99),
        ],
      },
    ],
  },
  {
    id: "video-streaming",
    title: "Video Streaming",
    summary: "A YouTube-style platform: upload media, stream it globally, and keep it fast everywhere.",
    levels: [
      {
        title: "Upload and Watch",
        difficulty: "easy",
        scenario: "Users can upload a video and others can watch it.",
        requirements: {
          functional: ["Users can upload a video", "Users can watch a video"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Serve From the Edge",
        difficulty: "medium",
        scenario: "Streaming video straight from your origin server is slow and expensive. Push it to a CDN.",
        requirements: {
          functional: ["Viewers stream video with low latency"],
          nonFunctional: ["Handle at least 800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("cdn", "a CDN"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "cdn", "Client", "CDN"),
          connectObjective("cdn", "api", "CDN", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(800),
          availabilityObjective(97),
        ],
      },
      {
        title: "Global Audience",
        difficulty: "hard",
        scenario: "You're streaming to viewers on every continent. Push to the edge, scale the API tier, and give reads room to grow with a read replica.",
        requirements: {
          functional: ["Viewers anywhere in the world get a responsive stream"],
          nonFunctional: ["Handle at least 3,500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("cdn", "a CDN"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          databaseReplicaObjective,
          connectObjective("client", "cdn", "Client", "CDN"),
          connectObjective("cdn", "load-balancer", "CDN", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(3500),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "ticket-booking",
    title: "Ticket Booking",
    summary: "A Ticketmaster-style booking system: sell seats correctly under pressure, never double-book.",
    levels: [
      {
        title: "Book a Seat",
        difficulty: "easy",
        scenario: "Users can browse events and book a seat.",
        requirements: {
          functional: ["Users can browse events", "Users can book a seat"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Never Double-Book a Seat",
        difficulty: "medium",
        scenario: "Two people can't hold the same seat. Stale reads are unacceptable here -- dial consistency up, even at some latency cost.",
        requirements: {
          functional: ["Seat availability is always accurate"],
          nonFunctional: ["Handle at least 900 requests/sec", "Strong consistency on the booking database", "95% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          strongConsistencyObjective(80),
          throughputObjective(900),
          availabilityObjective(95),
        ],
      },
      {
        title: "On-Sale Traffic Spike",
        difficulty: "hard",
        scenario: "Tickets for the biggest show of the year go on sale in 60 seconds. Infrastructure WILL fail under this load -- survive any single component going down.",
        requirements: {
          functional: ["Booking keeps working even if a server dies mid-sale"],
          nonFunctional: ["Handle at least 3,500 requests/sec", "No single point of failure", "96% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          databaseReplicaObjective,
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(3500),
          noSpofObjective(3500),
          availabilityObjective(96),
        ],
      },
    ],
  },
  {
    id: "vacation-rentals",
    title: "Vacation Rentals",
    summary: "An Airbnb-style booking platform: search listings, book a stay, handle peak season.",
    levels: [
      {
        title: "Search and Book",
        difficulty: "easy",
        scenario: "Users can search listings and book a stay.",
        requirements: {
          functional: ["Users can search listings", "Users can book a stay"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Search Gets Hammered",
        difficulty: "medium",
        scenario: "Search happens far more often than booking. Cache search results to keep the database from melting.",
        requirements: {
          functional: ["Search stays fast even with heavy browsing traffic"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(1800),
          availabilityObjective(97),
        ],
      },
      {
        title: "Peak Season",
        difficulty: "hard",
        scenario: "Summer booking season triples your traffic overnight. Scale the API tier horizontally to keep up.",
        requirements: {
          functional: ["Search and booking both stay responsive during peak season"],
          nonFunctional: ["Handle at least 3,800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(3800),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "team-chat",
    title: "Team Chat",
    summary: "A Slack-style workspace chat: send messages, deliver them everywhere, never lose one.",
    levels: [
      {
        title: "Send a Message",
        difficulty: "easy",
        scenario: "Users can send a message and see the channel history.",
        requirements: {
          functional: ["Users can send a message", "Users can view channel history"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Deliver to Every Device",
        difficulty: "medium",
        scenario: "A message needs to reach desktop, mobile, and email digest -- independently, without one slow channel blocking the others.",
        requirements: {
          functional: ["A message fans out to desktop, mobile, and email independently"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("desktop, mobile, email"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(1800),
          availabilityObjective(99),
        ],
      },
      {
        title: "Chat Can't Go Down",
        difficulty: "hard",
        scenario: "Your workspace is now mission-critical for thousands of teams. Message delivery must survive any single component failing.",
        requirements: {
          functional: ["Message delivery keeps working even if a server dies"],
          nonFunctional: ["Handle at least 2,000 requests/sec", "No single point of failure", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("desktop, mobile, email"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(2000),
          noSpofObjective(2000),
          availabilityObjective(99),
        ],
      },
    ],
  },
  {
    id: "cloud-storage",
    title: "Cloud File Storage",
    summary: "A Dropbox-style file sync service: upload files, keep them durable, serve them at scale.",
    levels: [
      {
        title: "Upload a File",
        difficulty: "easy",
        scenario: "Users can upload a file and download it later.",
        requirements: {
          functional: ["Users can upload a file", "Users can download a file"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Files Need a Real Home",
        difficulty: "medium",
        scenario: "File bytes don't belong in a relational database. Move them to durable object storage; keep only metadata in the database.",
        requirements: {
          functional: ["Users can upload and download files of any size"],
          nonFunctional: ["Handle at least 1,500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("object-storage", "Object Storage"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "object-storage", "API", "Object Storage", "file bytes"),
          connectObjective("api", "database", "API", "Database", "file metadata"),
          throughputObjective(1500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Sync at Scale",
        difficulty: "hard",
        scenario: "Millions of devices are syncing constantly. Scale the API tier and cache hot metadata lookups.",
        requirements: {
          functional: ["File sync stays fast for a large, active user base"],
          nonFunctional: ["Handle at least 4,000 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("object-storage", "Object Storage"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "object-storage", "API", "Object Storage"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(4000),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "business-reviews",
    title: "Business Reviews",
    summary: "A Yelp-style reviews platform: post reviews, browse listings, handle flexible review data.",
    levels: [
      {
        title: "Post a Review",
        difficulty: "easy",
        scenario: "Users can post a review for a business and read others' reviews.",
        requirements: {
          functional: ["Users can post a review", "Users can read reviews for a business"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Flexible Review Data",
        difficulty: "medium",
        scenario: "Reviews come with wildly different fields -- photos, ratings, tags, replies. A rigid schema keeps fighting you. Choose an engine built for that.",
        requirements: {
          functional: ["Reviews can carry flexible, evolving fields"],
          nonFunctional: ["Handle at least 1,200 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          useNoSqlObjective(),
          throughputObjective(1200),
          availabilityObjective(97),
        ],
      },
      {
        title: "Every City, Every Search",
        difficulty: "hard",
        scenario: "You're live in every major city now. Scale the API tier and shield your NoSQL store with a cache for hot searches.",
        requirements: {
          functional: ["Business search and reviews stay fast nationwide"],
          nonFunctional: ["Handle at least 4,000 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          useNoSqlObjective(),
          throughputObjective(4000),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "collab-docs",
    title: "Collaborative Docs",
    summary: "A Google-Docs-style editor: edit documents, autosave in the background, sync changes in real time.",
    levels: [
      {
        title: "Edit a Document",
        difficulty: "easy",
        scenario: "Users can open a document and edit its content.",
        requirements: {
          functional: ["Users can open and edit a document"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Autosave in the Background",
        difficulty: "medium",
        scenario: "Every keystroke can't trigger a synchronous save. Queue autosave work so typing never blocks on disk I/O.",
        requirements: {
          functional: ["Edits are saved automatically without blocking typing"],
          nonFunctional: ["Handle at least 900 requests/sec", "97% availability", "No anti-pattern connections"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("queue", "a Queue"),
          addObjective("worker", "a Worker"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "queue", "API", "Queue"),
          connectObjective("queue", "worker", "Queue", "Worker"),
          connectObjective("worker", "database", "Worker", "Database"),
          noBadConnectionsObjective,
          throughputObjective(900),
          availabilityObjective(97),
        ],
      },
      {
        title: "Real-Time Collaboration",
        difficulty: "hard",
        scenario: "Multiple people are editing the same document live. Every change must fan out to every connected client's session, autosave, and version history independently.",
        requirements: {
          functional: ["Edits fan out to live sessions, autosave, and version history independently"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("live sync, autosave, version history"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(1800),
          availabilityObjective(99),
        ],
      },
    ],
  },
  {
    id: "live-streaming",
    title: "Live Streaming",
    summary: "A Twitch-style live platform: stream video, chat in real time, scale for a big broadcast.",
    levels: [
      {
        title: "Watch a Stream",
        difficulty: "easy",
        scenario: "Users can watch a live stream.",
        requirements: {
          functional: ["Users can watch a live stream"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Serve Video From the Edge",
        difficulty: "medium",
        scenario: "Streaming straight from origin doesn't scale. Push the video feed to a CDN.",
        requirements: {
          functional: ["Viewers watch with low-latency edge delivery"],
          nonFunctional: ["Handle at least 800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("cdn", "a CDN"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "cdn", "Client", "CDN"),
          connectObjective("cdn", "api", "CDN", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(800),
          availabilityObjective(97),
        ],
      },
      {
        title: "A Chat Room of a Million People",
        difficulty: "hard",
        scenario: "A massive broadcast means chat messages must fan out to moderation, storage, and viewer delivery independently -- while video keeps streaming from the edge.",
        requirements: {
          functional: ["Chat fans out to moderation, storage, and delivery independently"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("cdn", "a CDN"),
          addObjective("api", "an API Server"),
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("moderation, storage, delivery"),
          connectObjective("client", "cdn", "Client", "CDN"),
          connectObjective("cdn", "api", "CDN", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(1800),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "music-streaming",
    title: "Music Streaming",
    summary: "A Spotify-style music service: stream tracks, browse a huge catalog, scale globally.",
    levels: [
      {
        title: "Play a Track",
        difficulty: "easy",
        scenario: "Users can browse tracks and play one.",
        requirements: {
          functional: ["Users can browse and play a track"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Stream From the Edge",
        difficulty: "medium",
        scenario: "Audio streaming needs to be low-latency everywhere. Push track delivery to a CDN.",
        requirements: {
          functional: ["Tracks stream with low latency"],
          nonFunctional: ["Handle at least 800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("cdn", "a CDN"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "cdn", "Client", "CDN"),
          connectObjective("cdn", "api", "CDN", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(800),
          availabilityObjective(97),
        ],
      },
      {
        title: "A Catalog of Everything",
        difficulty: "hard",
        scenario: "Tens of millions of tracks with fast-changing metadata (plays, likes, playlists). A flexible NoSQL catalog, shielded by a cache, is the only thing that keeps up.",
        requirements: {
          functional: ["Catalog browsing stays fast at massive scale"],
          nonFunctional: ["Handle at least 4,000 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("cdn", "a CDN"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "cdn", "Client", "CDN"),
          connectObjective("cdn", "load-balancer", "CDN", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          useNoSqlObjective(),
          throughputObjective(4000),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "ecommerce-checkout",
    title: "E-Commerce Checkout",
    summary: "An Amazon-style checkout flow: browse products, buy correctly, survive Black Friday.",
    levels: [
      {
        title: "Browse and Buy",
        difficulty: "easy",
        scenario: "Users can browse products and complete a purchase.",
        requirements: {
          functional: ["Users can browse products", "Users can complete checkout"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Never Oversell Inventory",
        difficulty: "medium",
        scenario: "Two customers can't buy the last unit of the same item. Inventory reads must be strongly consistent, even at some latency cost.",
        requirements: {
          functional: ["Inventory counts are always accurate at checkout"],
          nonFunctional: ["Handle at least 900 requests/sec", "Strong consistency on the inventory database", "95% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          strongConsistencyObjective(80),
          throughputObjective(900),
          availabilityObjective(95),
        ],
      },
      {
        title: "Black Friday",
        difficulty: "hard",
        scenario: "Infrastructure WILL fail under peak sale-day load. Your checkout flow must keep serving traffic even when any single component goes down.",
        requirements: {
          functional: ["Checkout keeps working through Black Friday traffic"],
          nonFunctional: ["Handle at least 3,500 requests/sec", "No single point of failure", "96% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          databaseReplicaObjective,
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(3500),
          noSpofObjective(3500),
          availabilityObjective(96),
        ],
      },
    ],
  },
  {
    id: "professional-network",
    title: "Professional Network",
    summary: "A LinkedIn-style network: build a profile, connect with others, scale to millions of members.",
    levels: [
      {
        title: "Build a Profile",
        difficulty: "easy",
        scenario: "Users can create a profile and view others' profiles.",
        requirements: {
          functional: ["Users can create and view profiles"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "A Web of Connections",
        difficulty: "medium",
        scenario: "Profiles, connections, and endorsements don't fit neatly into rigid tables. A flexible schema keeps you moving fast.",
        requirements: {
          functional: ["The network stores flexible, densely-linked profile data"],
          nonFunctional: ["Handle at least 1,200 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          useNoSqlObjective(),
          throughputObjective(1200),
          availabilityObjective(97),
        ],
      },
      {
        title: "Millions of Members",
        difficulty: "hard",
        scenario: "You're a household name now. Scale the API tier horizontally and cache the profile lookups everyone keeps hitting.",
        requirements: {
          functional: ["Profile browsing stays fast at a huge scale"],
          nonFunctional: ["Handle at least 4,000 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          useNoSqlObjective(),
          throughputObjective(4000),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "instant-messaging",
    title: "Instant Messaging",
    summary: "A WhatsApp-style messenger: send messages 1-to-1, deliver reliably, never go down.",
    levels: [
      {
        title: "Send a Message",
        difficulty: "easy",
        scenario: "Users can send a message to another user.",
        requirements: {
          functional: ["Users can send and receive messages"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Deliver Reliably",
        difficulty: "medium",
        scenario: "A message needs to reach the recipient's push notification, backup storage, and delivery receipt system -- independently.",
        requirements: {
          functional: ["A message fans out to push, storage, and delivery receipts independently"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("push, backup, receipts"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(1800),
          availabilityObjective(99),
        ],
      },
      {
        title: "Never Miss a Message",
        difficulty: "hard",
        scenario: "Billions of messages a day. Delivery must survive any single component failing -- nobody should ever lose a message because a server died.",
        requirements: {
          functional: ["Message delivery survives a component failure"],
          nonFunctional: ["Handle at least 2,000 requests/sec", "No single point of failure", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("push, backup, receipts"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(2000),
          noSpofObjective(2000),
          availabilityObjective(99),
        ],
      },
    ],
  },
  {
    id: "public-api-platform",
    title: "Public API Platform",
    summary: "A developer-facing API product: one stable entry point, the right protocol, scale on a budget.",
    levels: [
      {
        title: "A Gateway Out Front",
        difficulty: "easy",
        scenario: "External developers call your API. You want a single, consistent entry point that handles auth and rate limiting before requests reach your services.",
        requirements: {
          functional: ["External clients call one stable API endpoint"],
          nonFunctional: ["Handle at least 900 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api-gateway", "an API Gateway"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api-gateway", "Client", "API Gateway"),
          connectObjective("api-gateway", "api", "API Gateway", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(900),
          availabilityObjective(97),
        ],
      },
      {
        title: "Choosing a Protocol",
        difficulty: "medium",
        scenario: "Developers keep over-fetching and under-fetching data with plain REST. Give them a protocol that lets them ask for exactly what they need.",
        requirements: {
          functional: ["Developers fetch exactly the fields they need in one request"],
          nonFunctional: ["Handle at least 900 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api-gateway", "an API Gateway"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api-gateway", "Client", "API Gateway"),
          connectObjective("api-gateway", "api", "API Gateway", "API"),
          connectObjective("api", "database", "API", "Database"),
          {
            id: "use-graphql",
            description: "Configure the Gateway's Protocol as GraphQL",
            why: "GraphQL lets a client ask for exactly the fields it needs in one request, instead of over-fetching with multiple REST round-trips.",
            check: (nodes) => hasSecondaryVariant(nodes, "api-gateway", "graphql"),
          },
          throughputObjective(900),
          availabilityObjective(97),
        ],
      },
      {
        title: "Scale on a Budget",
        difficulty: "hard",
        scenario: "Your API platform needs real scale, but the CFO is watching every dollar. Hit the throughput bar without over-provisioning.",
        requirements: {
          functional: ["The platform serves production-level traffic"],
          nonFunctional: ["Handle at least 8,000 requests/sec", "97% availability", "Keep monthly cost at or under $500"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(8000),
          availabilityObjective(97),
          budgetObjective(500),
        ],
      },
    ],
  },
  {
    id: "web-crawler",
    title: "Distributed Web Crawler",
    summary: "A search-engine-style crawler: fetch pages, store what you find, scale to crawl the web.",
    levels: [
      {
        title: "Crawl a Page",
        difficulty: "easy",
        scenario: "The API accepts a URL to crawl and stores what it finds. Crawling is slow, so it shouldn't block the request.",
        requirements: {
          functional: ["Submitting a URL queues it for crawling"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability", "No anti-pattern connections"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("queue", "a Queue"),
          addObjective("worker", "a Worker"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "queue", "API", "Queue"),
          connectObjective("queue", "worker", "Queue", "Worker"),
          connectObjective("worker", "database", "Worker", "Database"),
          noBadConnectionsObjective,
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Crawl in Parallel",
        difficulty: "medium",
        scenario: "One crawler worker is far too slow for the open web. Run many workers in parallel, and store pages in a schema-flexible store.",
        requirements: {
          functional: ["Many pages are crawled in parallel"],
          nonFunctional: ["Handle at least 1,200 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("queue", "a Queue"),
          threeWorkersObjective("parallel crawlers"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "queue", "API", "Queue"),
          connectObjective("queue", "worker", "Queue", "Worker"),
          connectObjective("worker", "database", "Worker", "Database"),
          useNoSqlObjective(),
          throughputObjective(1200),
          availabilityObjective(97),
        ],
      },
      {
        title: "Crawl the Web",
        difficulty: "hard",
        scenario: "You're indexing at web scale now. Scale the API tier that accepts crawl jobs, and give your page store room to grow with a read replica.",
        requirements: {
          functional: ["The crawl pipeline accepts jobs at high volume"],
          nonFunctional: ["Handle at least 3,500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("queue", "a Queue"),
          threeWorkersObjective("parallel crawlers"),
          databaseReplicaObjective,
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "queue", "API", "Queue"),
          connectObjective("queue", "worker", "Queue", "Worker"),
          connectObjective("worker", "database", "Worker", "Database"),
          throughputObjective(3500),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "notification-service",
    title: "Notification Service",
    summary: "An internal notification platform: log events, deliver them everywhere, never fail silently.",
    levels: [
      {
        title: "Log a Notification",
        difficulty: "easy",
        scenario: "Other services call your API to record a notification for a user.",
        requirements: {
          functional: ["Services can submit a notification for a user"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Every Channel, Independently",
        difficulty: "medium",
        scenario: "A notification needs to go out over email, SMS, and push -- independently, so a slow SMS provider never delays email.",
        requirements: {
          functional: ["A notification fans out to email, SMS, and push independently"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("email, SMS, push"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(1800),
          availabilityObjective(99),
        ],
      },
      {
        title: "Notifications Must Never Fail",
        difficulty: "hard",
        scenario: "Every other service in the company depends on you now. Delivery must survive any single component failing.",
        requirements: {
          functional: ["Delivery survives a component failure"],
          nonFunctional: ["Handle at least 2,000 requests/sec", "No single point of failure", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("email, SMS, push"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(2000),
          noSpofObjective(2000),
          availabilityObjective(99),
        ],
      },
    ],
  },
  {
    id: "leaderboard-service",
    title: "Leaderboard Service",
    summary: "A gaming leaderboard: submit scores, read rankings fast, survive a viral tournament.",
    levels: [
      {
        title: "Submit a Score",
        difficulty: "easy",
        scenario: "Players submit a score and can view the leaderboard.",
        requirements: {
          functional: ["Players can submit a score", "Players can view the leaderboard"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Everyone Checks the Rankings",
        difficulty: "medium",
        scenario: "Leaderboard reads dwarf score submissions. Cache the rankings so the database isn't recalculating them on every request.",
        requirements: {
          functional: ["Leaderboard reads stay fast under heavy traffic"],
          nonFunctional: ["Handle at least 1,800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(1800),
          availabilityObjective(97),
        ],
      },
      {
        title: "Viral Tournament",
        difficulty: "hard",
        scenario: "A tournament just went viral and everyone's refreshing the leaderboard at once. Scale the API tier horizontally to keep up.",
        requirements: {
          functional: ["The leaderboard stays responsive during a massive traffic spike"],
          nonFunctional: ["Handle at least 3,800 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("cache", "a Cache"),
          addObjective("database", "a Database"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "cache", "API", "Cache"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(3800),
          availabilityObjective(97),
        ],
      },
    ],
  },
  {
    id: "market-data-pipeline",
    title: "Market Data Ingestion Pipeline",
    summary: "A high-volume feed of trades and quotes: ingest fast, process asynchronously, fan out to every downstream system.",
    levels: [
      {
        title: "Ingest and Store a Tick",
        difficulty: "easy",
        scenario: "A feed of market ticks (trades and quotes) needs to be accepted and persisted so later requests can look them up.",
        requirements: {
          functional: ["The API accepts an incoming tick", "Users can query recent tick data"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Don't Block the Feed",
        difficulty: "medium",
        scenario: "The exchange doesn't wait for you. Ingestion has to accept every tick instantly while the actual parsing, validation, and storage happen asynchronously in the background.",
        requirements: {
          functional: ["Ticks are accepted immediately", "Processing happens without blocking ingestion"],
          nonFunctional: ["Handle at least 900 requests/sec", "97% availability", "No anti-pattern connections"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("queue", "a Queue"),
          addObjective("worker", "a Worker"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "queue", "API", "Queue"),
          connectObjective("queue", "worker", "Queue", "Worker"),
          connectObjective("worker", "database", "Worker", "Database"),
          noBadConnectionsObjective,
          throughputObjective(900),
          availabilityObjective(97),
        ],
      },
      {
        title: "Fan Out to Every Downstream System",
        difficulty: "hard",
        scenario: "Every tick needs to reach the risk engine, the notification service, and the historical archive independently -- a slow archive write should never delay a risk alert.",
        requirements: {
          functional: ["Each tick fans out to risk, notifications, and archival independently"],
          nonFunctional: ["Handle at least 2,000 requests/sec", "No single point of failure", "99% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          addObjective("message-broker", "a Message Broker"),
          threeWorkersObjective("risk engine, notifications, archive"),
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "message-broker", "API", "Message Broker"),
          fanOutObjective("message-broker", "the broker"),
          throughputObjective(2000),
          noSpofObjective(2000),
          availabilityObjective(99),
        ],
      },
    ],
  },
  {
    id: "portfolio-risk-platform",
    title: "Portfolio Risk Analytics Platform",
    summary: "An institutional-grade risk platform, in the spirit of the systems large asset managers run internally: heavy data processing, numbers that can't be wrong.",
    levels: [
      {
        title: "Compute a Portfolio's Risk Score",
        difficulty: "easy",
        scenario: "Given a portfolio's holdings, the API computes and returns a basic risk score.",
        requirements: {
          functional: ["Users can request a risk score for a portfolio"],
          nonFunctional: ["Handle at least 500 requests/sec", "97% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          throughputObjective(500),
          availabilityObjective(97),
        ],
      },
      {
        title: "Numbers That Can't Be Stale",
        difficulty: "medium",
        scenario: "A risk calculation built on a stale position is worse than no calculation at all. Reads of portfolio holdings must be strongly consistent, even at some latency cost.",
        requirements: {
          functional: ["Risk scores always reflect the latest known positions"],
          nonFunctional: ["Handle at least 900 requests/sec", "Strong consistency on the positions database", "95% availability"],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("api", "an API Server"),
          addObjective("database", "a Database"),
          connectObjective("client", "api", "Client", "API"),
          connectObjective("api", "database", "API", "Database"),
          strongConsistencyObjective(80),
          throughputObjective(900),
          availabilityObjective(95),
        ],
      },
      {
        title: "Institutional Scale, Zero Tolerance for Downtime",
        difficulty: "hard",
        scenario: "Billions of dollars in holdings run through this platform every day. It has to keep computing risk under heavy load, stay reasonably consistent, and survive any single component failing -- a risk platform that's down is worse than useless.",
        requirements: {
          functional: ["Risk analytics keep working even if a server dies mid-session"],
          nonFunctional: [
            "Handle at least 3,500 requests/sec",
            "Consistency at least 65 on the positions database",
            "No single point of failure",
            "96% availability",
          ],
        },
        objectives: [
          addObjective("client", "a Client"),
          addObjective("load-balancer", "a Load Balancer"),
          twoApiReplicasObjective,
          databaseReplicaObjective,
          connectObjective("client", "load-balancer", "Client", "Load Balancer"),
          connectObjective("load-balancer", "api", "Load Balancer", "API"),
          connectObjective("api", "database", "API", "Database"),
          strongConsistencyObjective(65),
          throughputObjective(3500),
          noSpofObjective(3500),
          availabilityObjective(96),
        ],
      },
    ],
  },
];

export const LEVELS: Level[] = PROJECTS.flatMap((project) =>
  project.levels.map((level) => ({
    ...level,
    id: `${project.id}-${level.difficulty}`,
    projectId: project.id,
    projectTitle: project.title,
  }))
);

export function getLevel(levelId: string): Level | undefined {
  return LEVELS.find((l) => l.id === levelId);
}

export function getProject(projectId: string): Project | undefined {
  return PROJECTS.find((p) => p.id === projectId);
}

export const DEFAULT_LEVEL_ID = LEVELS[0].id;

// The level that comes after this one in the campaign, in play order: the
// next tier of the same project, or the Easy level of the next project once
// a project's Hard tier is done (wrapping back to the very first level).
export function getNextLevelId(levelId: string): string {
  const index = LEVELS.findIndex((l) => l.id === levelId);
  if (index === -1) return DEFAULT_LEVEL_ID;
  return LEVELS[(index + 1) % LEVELS.length].id;
}

export interface LevelProgress {
  objectiveId: string;
  description: string;
  why: string;
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
    why: objective.why,
    completed: objective.check(nodes, edges, metrics),
  }));

  return { progress, allComplete: progress.every((p) => p.completed) };
}

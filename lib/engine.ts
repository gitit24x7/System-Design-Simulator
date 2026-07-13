// Core rules engine: component definitions, connection validation, and system-wide metrics.

// Stand-in for "unlimited" capacity (the client, which only generates load
// and is never a bottleneck). Deliberately a large finite number rather than
// Infinity: JSON.stringify(Infinity) === "null", which would silently zero
// out the client's capacity after any localStorage reload or shared-link
// round-trip.
export const UNLIMITED_RPS = 1_000_000_000;

export type ComponentType =
  | "client"
  | "cdn"
  | "load-balancer"
  | "api-gateway"
  | "api"
  | "cache"
  | "database"
  | "object-storage"
  | "queue"
  | "message-broker"
  | "worker";

export type NodeHealth = "healthy" | "dead";

export interface SystemComponent {
  type: ComponentType;
  label: string;
  /** User-set override (via rename). Takes priority over the variant/provider label when present. */
  customLabel?: string;
  maxRps: number;
  latencyMs: number;
  costPerMonth: number;
  health: NodeHealth;
  /** Id of the active entry in COMPONENT_VARIANTS[type]. */
  variant: string;
  /** Id of the active entry in SECONDARY_VARIANTS[type], if that type has a second axis. Always "generic" for types without one. */
  secondaryVariant: string;
  /** CAP theorem dial, 0 = eventual consistency, 100 = strong. Only meaningful for databases. */
  consistency: number;
  /** Simulated real-time degradation, 0 = normal, 100 = severely degraded. The
   * node stays "healthy" (doesn't count as an outage) but runs slower and
   * with less capacity -- for testing partial failure, not just alive/dead. */
  degradation: number;
}

export type CloudProvider = "generic" | "aws" | "gcp" | "azure";

export interface ProviderInfo {
  label: string;
  costMultiplier: number;
}

export interface ComponentVariant {
  id: string;
  label: string;
  maxRps: number;
  latencyMs: number;
  costPerMonth: number;
  pros: string[];
  cons: string[];
  providers?: Partial<Record<Exclude<CloudProvider, "generic">, ProviderInfo>>;
}

// A second, independent axis of configuration (e.g. SQL vs NoSQL is a
// different question from Single Instance vs Read Replica). Unlike
// ComponentVariant, these express *multipliers* on top of whatever the
// primary variant already set, so the two axes combine cleanly. "generic"
// is always the neutral (multiplier = 1) default so picking a topology
// variant alone -- without opinion on engine/protocol -- behaves exactly
// as before this feature existed.
export interface SecondaryVariantOption {
  id: string;
  label: string;
  maxRpsMultiplier: number;
  latencyMultiplier: number;
  costMultiplier: number;
  pros: string[];
  cons: string[];
}

export interface SecondaryVariantAxis {
  id: string;
  label: string;
  options: SecondaryVariantOption[];
}

const NEUTRAL_SECONDARY_OPTION: SecondaryVariantOption = {
  id: "generic",
  label: "Generic",
  maxRpsMultiplier: 1,
  latencyMultiplier: 1,
  costMultiplier: 1,
  pros: [],
  cons: [],
};

// Every component type has at least one ("default") variant. Types with more
// than one variant get a switcher in the Node Inspector.
export const COMPONENT_VARIANTS: Record<ComponentType, ComponentVariant[]> = {
  client: [
    {
      id: "default",
      label: "Client",
      maxRps: UNLIMITED_RPS,
      latencyMs: 0,
      costPerMonth: 0,
      pros: ["Represents real user traffic -- no configuration needed"],
      cons: ["Never a source of capacity; always the thing generating load"],
    },
  ],
  cdn: [
    {
      id: "default",
      label: "CDN",
      maxRps: 50000,
      latencyMs: 5,
      costPerMonth: 80,
      pros: ["Cuts latency for static assets by serving from the edge", "Offloads traffic from origin servers"],
      cons: ["Cache invalidation is hard to get right", "Adds cost", "Not useful for highly dynamic/personalized content"],
      providers: {
        aws: { label: "Amazon CloudFront", costMultiplier: 1.0 },
        gcp: { label: "Cloud CDN", costMultiplier: 0.9 },
        azure: { label: "Azure CDN", costMultiplier: 0.95 },
      },
    },
  ],
  "load-balancer": [
    {
      id: "default",
      label: "Load Balancer",
      maxRps: 20000,
      latencyMs: 2,
      costPerMonth: 40,
      pros: ["Enables horizontal scaling across many backends", "Improves availability via health checks"],
      cons: ["Extra network hop adds latency", "Becomes a new SPOF unless it's itself redundant", "Sticky sessions complicate stateful apps"],
      providers: {
        aws: { label: "Elastic Load Balancer (ALB)", costMultiplier: 1.0 },
        gcp: { label: "Cloud Load Balancing", costMultiplier: 0.95 },
        azure: { label: "Azure Load Balancer", costMultiplier: 1.05 },
      },
    },
  ],
  "api-gateway": [
    {
      id: "basic",
      label: "Basic Gateway",
      maxRps: 15000,
      latencyMs: 3,
      costPerMonth: 50,
      pros: ["Single entry point for auth and routing", "Decouples clients from internal service topology"],
      cons: ["No protection against traffic spikes or abusive clients", "Extra hop adds latency"],
      providers: {
        aws: { label: "Amazon API Gateway", costMultiplier: 1.0 },
        gcp: { label: "Apigee / Cloud Endpoints", costMultiplier: 1.05 },
        azure: { label: "Azure API Management", costMultiplier: 1.05 },
      },
    },
    {
      id: "rate-limited",
      label: "Gateway + Rate Limiting",
      maxRps: 12000,
      latencyMs: 5,
      costPerMonth: 90,
      pros: ["Protects backends from abusive or runaway clients", "Enables per-client quotas and fair usage"],
      cons: ["Added latency from request accounting", "Choosing the right algorithm (token bucket, sliding window) is its own design problem", "Can false-positive throttle legitimate bursty traffic"],
      providers: {
        aws: { label: "Amazon API Gateway (usage plans)", costMultiplier: 1.15 },
        gcp: { label: "Apigee (quota policies)", costMultiplier: 1.2 },
        azure: { label: "Azure API Management (rate limit policy)", costMultiplier: 1.2 },
      },
    },
  ],
  api: [
    {
      id: "monolith",
      label: "Monolith",
      maxRps: 2000,
      latencyMs: 20,
      costPerMonth: 60,
      pros: ["Simple to deploy and reason about", "Lower operational cost", "Easy transactions across features"],
      cons: ["Whole app scales together, even for one hot endpoint", "One bug can take down everything", "CI/CD slows down as the codebase grows"],
      providers: {
        aws: { label: "Amazon EC2 (single instance)", costMultiplier: 1.0 },
        gcp: { label: "Compute Engine", costMultiplier: 0.95 },
        azure: { label: "Azure Virtual Machine", costMultiplier: 1.05 },
      },
    },
    {
      id: "microservices",
      label: "Microservices",
      maxRps: 6000,
      latencyMs: 30,
      costPerMonth: 160,
      pros: ["Scale hot services independently", "Teams can deploy independently", "Fault isolation between services"],
      cons: ["Higher operational complexity (service discovery, networking)", "Distributed transactions are hard", "More expensive at small scale"],
      providers: {
        aws: { label: "ECS / EKS (Fargate)", costMultiplier: 1.2 },
        gcp: { label: "GKE Autopilot", costMultiplier: 1.1 },
        azure: { label: "Azure Kubernetes Service", costMultiplier: 1.15 },
      },
    },
  ],
  cache: [
    {
      id: "default",
      label: "Cache",
      maxRps: 10000,
      latencyMs: 2,
      costPerMonth: 30,
      pros: ["Dramatically reduces read latency and DB load", "Cheap way to absorb read spikes"],
      cons: ["Cache invalidation is famously hard", "Risk of serving stale data", "Cold-start cache stampede risk"],
      providers: {
        aws: { label: "Amazon ElastiCache (Redis)", costMultiplier: 1.0 },
        gcp: { label: "Memorystore", costMultiplier: 0.95 },
        azure: { label: "Azure Cache for Redis", costMultiplier: 1.05 },
      },
    },
  ],
  database: [
    {
      id: "single",
      label: "Single Instance",
      maxRps: 1000,
      latencyMs: 15,
      costPerMonth: 100,
      pros: ["Simple, strongly consistent by default", "Cheapest option", "Easy to reason about"],
      cons: ["Single point of failure", "Read capacity doesn't scale", "Downtime during maintenance/failover"],
      providers: {
        aws: { label: "Amazon RDS (Single-AZ)", costMultiplier: 1.0 },
        gcp: { label: "Cloud SQL (Single Zone)", costMultiplier: 0.9 },
        azure: { label: "Azure SQL DB (Single)", costMultiplier: 1.1 },
      },
    },
    {
      id: "read-replica",
      label: "Read Replica",
      maxRps: 4000,
      latencyMs: 18,
      costPerMonth: 220,
      pros: ["Reads scale horizontally", "Improves read availability", "Can serve reads from a region closer to users"],
      cons: ["Replication lag means stale reads (eventual consistency)", "Writes are still bottlenecked on the primary", "More expensive, more moving parts"],
      providers: {
        aws: { label: "Amazon RDS (Read Replica)", costMultiplier: 1.15 },
        gcp: { label: "Cloud SQL (Read Replica)", costMultiplier: 1.05 },
        azure: { label: "Azure SQL DB (Read Replica)", costMultiplier: 1.2 },
      },
    },
  ],
  "object-storage": [
    {
      id: "single-region",
      label: "Single-Region",
      maxRps: 8000,
      latencyMs: 25,
      costPerMonth: 50,
      pros: ["Cheap, durable storage for large files/blobs", "Simple to reason about"],
      cons: ["A regional outage makes objects unavailable", "Higher latency for users far from the region"],
      providers: {
        aws: { label: "Amazon S3 (Single-Region)", costMultiplier: 1.0 },
        gcp: { label: "Cloud Storage (Regional)", costMultiplier: 0.95 },
        azure: { label: "Azure Blob Storage (LRS)", costMultiplier: 1.05 },
      },
    },
    {
      id: "multi-region",
      label: "Multi-Region",
      maxRps: 20000,
      latencyMs: 15,
      costPerMonth: 140,
      pros: ["Survives a full regional outage", "Lower latency for a globally distributed user base"],
      cons: ["Cross-region replication lag and transfer cost", "More expensive than single-region"],
      providers: {
        aws: { label: "Amazon S3 (Multi-Region Access Points)", costMultiplier: 1.2 },
        gcp: { label: "Cloud Storage (Multi-Region)", costMultiplier: 1.1 },
        azure: { label: "Azure Blob Storage (GRS)", costMultiplier: 1.25 },
      },
    },
  ],
  queue: [
    {
      id: "default",
      label: "Queue",
      maxRps: 5000,
      latencyMs: 5,
      costPerMonth: 35,
      pros: ["Decouples producer/consumer, smooths traffic spikes", "Improves fault tolerance (retry later)"],
      cons: ["Adds latency -- work is async, not immediate", "Harder to reason about ordering/exactly-once delivery", "Another moving part to operate"],
      providers: {
        aws: { label: "Amazon SQS", costMultiplier: 1.0 },
        gcp: { label: "Pub/Sub", costMultiplier: 0.9 },
        azure: { label: "Azure Service Bus", costMultiplier: 1.05 },
      },
    },
  ],
  "message-broker": [
    {
      id: "default",
      label: "Message Broker",
      maxRps: 8000,
      latencyMs: 8,
      costPerMonth: 60,
      pros: ["Fans one event out to many independent consumers", "Durable, replayable event log", "Decouples producers from every consumer"],
      cons: ["Consumers must handle out-of-order or duplicate delivery", "Operationally heavier than a simple queue", "Exactly-once processing is hard to guarantee"],
      providers: {
        aws: { label: "Amazon Kinesis / MSK (Kafka)", costMultiplier: 1.1 },
        gcp: { label: "Pub/Sub (fan-out)", costMultiplier: 1.0 },
        azure: { label: "Azure Event Hubs", costMultiplier: 1.05 },
      },
    },
  ],
  worker: [
    {
      id: "default",
      label: "Worker",
      maxRps: 800,
      latencyMs: 30,
      costPerMonth: 50,
      pros: ["Offloads slow work from the request path", "Scales independently of the API"],
      cons: ["Completion is eventual, not immediate", "Needs monitoring for stuck/failed jobs"],
      providers: {
        aws: { label: "AWS Lambda / EC2 worker", costMultiplier: 1.0 },
        gcp: { label: "Cloud Run / Functions", costMultiplier: 0.9 },
        azure: { label: "Azure Functions", costMultiplier: 1.0 },
      },
    },
  ],
};

const PROTOCOL_AXIS: SecondaryVariantAxis = {
  id: "protocol",
  label: "Protocol",
  options: [
    NEUTRAL_SECONDARY_OPTION,
    {
      id: "rest",
      label: "REST",
      maxRpsMultiplier: 1,
      latencyMultiplier: 1,
      costMultiplier: 1,
      pros: ["Simple, cacheable, widely understood", "Great tooling and browser support"],
      cons: ["Over-fetching/under-fetching data is common", "Related resources often need multiple round-trips"],
    },
    {
      id: "graphql",
      label: "GraphQL",
      maxRpsMultiplier: 0.9,
      latencyMultiplier: 1.05,
      costMultiplier: 1.1,
      pros: ["Clients fetch exactly the fields they need", "One request can resolve nested/related data"],
      cons: ["Harder to cache at the HTTP layer", "A single expensive query can overload the backend", "More complex server-side implementation"],
    },
    {
      id: "grpc",
      label: "gRPC",
      maxRpsMultiplier: 1.2,
      latencyMultiplier: 0.8,
      costMultiplier: 1,
      pros: ["Fast binary protocol (protobuf), low latency", "Built-in streaming, great for service-to-service calls"],
      cons: ["Not natively browser-friendly (needs a proxy for web clients)", "Less human-readable, harder to debug ad hoc"],
    },
  ],
};

// Second, independent configuration axes. Not every type has one -- most
// don't, and getSecondaryVariants() returns undefined for those.
export const SECONDARY_VARIANTS: Partial<Record<ComponentType, SecondaryVariantAxis>> = {
  database: {
    id: "engine",
    label: "Engine",
    options: [
      NEUTRAL_SECONDARY_OPTION,
      {
        id: "sql",
        label: "SQL (Relational)",
        maxRpsMultiplier: 0.9,
        latencyMultiplier: 1.1,
        costMultiplier: 1,
        pros: ["Strong relational integrity and joins", "Mature query language and tooling", "ACID transactions across multiple rows/tables"],
        cons: ["Harder to scale horizontally -- sharding is largely manual", "Rigid schema makes rapid iteration harder"],
      },
      {
        id: "nosql",
        label: "NoSQL",
        maxRpsMultiplier: 1.3,
        latencyMultiplier: 0.9,
        costMultiplier: 0.95,
        pros: ["Flexible schema, fast to iterate", "Built for horizontal partitioning/sharding", "Handles high write throughput well"],
        cons: ["Weaker consistency guarantees by default (often eventual)", "Joins and multi-record transactions are hard or unsupported", "Less flexible ad hoc querying than SQL"],
      },
    ],
  },
  api: PROTOCOL_AXIS,
  "api-gateway": PROTOCOL_AXIS,
};

export function getSecondaryVariants(type: ComponentType): SecondaryVariantAxis | undefined {
  return SECONDARY_VARIANTS[type];
}

export function getSecondaryVariant(type: ComponentType, optionId: string): SecondaryVariantOption {
  const axis = SECONDARY_VARIANTS[type];
  return axis?.options.find((o) => o.id === optionId) ?? NEUTRAL_SECONDARY_OPTION;
}

// Simulated degradation: dial up to inject latency and shave capacity off a
// node in real time, without marking it dead -- for testing "slow but not
// down" scenarios that Chaos Monkey's binary kill can't express.
const DEGRADATION_MAX_LATENCY_MULTIPLIER = 2; // up to +200% (3x) latency at degradation=100
const DEGRADATION_MAX_RPS_REDUCTION = 0.8; // up to -80% capacity (down to 20%) at degradation=100

function degradationLatencyMultiplier(data: SystemComponent): number {
  return 1 + ((data.degradation ?? 0) / 100) * DEGRADATION_MAX_LATENCY_MULTIPLIER;
}

function degradationRpsMultiplier(data: SystemComponent): number {
  return 1 - ((data.degradation ?? 0) / 100) * DEGRADATION_MAX_RPS_REDUCTION;
}

export function getEffectiveMaxRps(data: SystemComponent): number {
  return (
    data.maxRps *
    getSecondaryVariant(data.type, data.secondaryVariant).maxRpsMultiplier *
    degradationRpsMultiplier(data)
  );
}

export function getEffectiveLatencyMs(data: SystemComponent): number {
  return (
    data.latencyMs *
    getSecondaryVariant(data.type, data.secondaryVariant).latencyMultiplier *
    degradationLatencyMultiplier(data)
  );
}

/** Base cost with the secondary-axis multiplier applied, before the cloud provider multiplier. */
export function getEffectiveBaseCost(data: SystemComponent): number {
  return data.costPerMonth * getSecondaryVariant(data.type, data.secondaryVariant).costMultiplier;
}

// Generic, variant-independent display name for a component type (used in
// the sidebar palette, where "API Server" should show regardless of whether
// the default variant is Monolith or Microservices).
export const TYPE_LABELS: Record<ComponentType, string> = {
  client: "Client",
  cdn: "CDN",
  "load-balancer": "Load Balancer",
  "api-gateway": "API Gateway",
  api: "API Server",
  cache: "Cache",
  database: "Database",
  "object-storage": "Object Storage",
  queue: "Queue",
  "message-broker": "Message Broker",
  worker: "Worker",
};

export const PROVIDER_LABELS: Record<CloudProvider, string> = {
  generic: "Generic",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
};

export function getVariants(type: ComponentType): ComponentVariant[] {
  return COMPONENT_VARIANTS[type];
}

export function getVariant(type: ComponentType, variantId: string): ComponentVariant {
  return COMPONENT_VARIANTS[type].find((v) => v.id === variantId) ?? COMPONENT_VARIANTS[type][0];
}

export function getDisplayLabel(
  type: ComponentType,
  variantId: string,
  provider: CloudProvider
): string {
  const variant = getVariant(type, variantId);
  if (provider === "generic") return variant.label;
  return variant.providers?.[provider]?.label ?? variant.label;
}

export function getProviderCostMultiplier(
  type: ComponentType,
  variantId: string,
  provider: CloudProvider
): number {
  if (provider === "generic") return 1;
  return getVariant(type, variantId).providers?.[provider]?.costMultiplier ?? 1;
}

// CAP theorem trade-offs at the current consistency dial position, for
// display in the Node Inspector.
export function getCapTradeoffs(consistency: number): { pros: string[]; cons: string[] } {
  if (consistency >= 50) {
    return {
      pros: [
        "Reads always return the latest write (linearizable)",
        "Simpler application logic -- no stale-read handling needed",
      ],
      cons: [
        "Higher write latency from synchronous replication/quorum",
        "Lower availability: may reject requests during a network partition (CAP)",
      ],
    };
  }
  return {
    pros: [
      "Lower latency -- no synchronous replication wait",
      "Stays available and responsive during a network partition",
    ],
    cons: [
      "Reads can return stale data (replication lag)",
      "Application must handle eventual convergence / conflicts",
    ],
  };
}

export const COMPONENT_DEFAULTS: Record<ComponentType, Omit<SystemComponent, "health">> =
  Object.fromEntries(
    (Object.keys(COMPONENT_VARIANTS) as ComponentType[]).map((type) => {
      const variant = COMPONENT_VARIANTS[type][0];
      return [
        type,
        {
          type,
          label: variant.label,
          maxRps: variant.maxRps,
          latencyMs: variant.latencyMs,
          costPerMonth: variant.costPerMonth,
          variant: variant.id,
          secondaryVariant: "generic",
          consistency: 50,
          degradation: 0,
        },
      ];
    })
  ) as Record<ComponentType, Omit<SystemComponent, "health">>;

export type ConnectionStatus = "optimal" | "acceptable" | "warning" | "error";

export interface ConnectionEvaluation {
  status: ConnectionStatus;
  message: string;
}

type ConnectionRule = Partial<Record<ComponentType, ConnectionEvaluation>>;

// Rules keyed by [source][target]. Missing entries fall back to a generic default.
const CONNECTION_RULES: Partial<Record<ComponentType, ConnectionRule>> = {
  client: {
    cdn: { status: "optimal", message: "Static assets served from the edge." },
    "load-balancer": { status: "optimal", message: "Traffic distributed across API instances." },
    "api-gateway": { status: "optimal", message: "Gateway handles auth, rate limiting, and routing for you." },
    api: { status: "acceptable", message: "Works, but has no failover if this API instance goes down." },
    database: { status: "error", message: "Clients must never talk directly to a database. Add an API layer." },
    cache: { status: "error", message: "Clients must never talk directly to a cache. Add an API layer." },
    "object-storage": { status: "acceptable", message: "Direct upload/download via pre-signed URLs is a common pattern, but skips your API's business logic unless you generate those URLs server-side." },
    queue: { status: "error", message: "Clients must never talk directly to a queue. Add an API layer." },
    "message-broker": { status: "error", message: "Clients must never publish directly to a message broker. Add an API layer." },
    worker: { status: "error", message: "Clients must never talk directly to a worker. Add an API layer." },
  },
  cdn: {
    api: { status: "optimal", message: "CDN falls back to origin on cache miss." },
    "api-gateway": { status: "optimal", message: "CDN forwards uncached requests to the gateway." },
    "load-balancer": { status: "optimal", message: "CDN forwards uncached requests to the load balancer." },
    "object-storage": { status: "optimal", message: "CDN caches and serves objects from origin storage -- the standard pattern for media delivery." },
    database: { status: "error", message: "A CDN should never connect straight to a database." },
  },
  "load-balancer": {
    api: { status: "optimal", message: "Requests distributed across API instances." },
    "api-gateway": { status: "acceptable", message: "Works, but usually the gateway sits in front of the load balancer, not behind it." },
    database: { status: "error", message: "Load balancers should route to services, not databases directly." },
  },
  "api-gateway": {
    api: { status: "optimal", message: "Gateway routes authenticated, rate-limited traffic to your services." },
    "load-balancer": { status: "optimal", message: "Gateway forwards to a load balancer for horizontal scaling." },
    database: { status: "error", message: "Gateways should route to services, not databases directly." },
  },
  api: {
    database: { status: "acceptable", message: "Direct DB access works, but this database is a single point of failure." },
    cache: { status: "optimal", message: "Reads offloaded to cache, reducing database load." },
    "object-storage": { status: "optimal", message: "Large files offloaded to dedicated blob storage instead of the database." },
    queue: { status: "optimal", message: "Work decoupled via a queue for async processing." },
    "message-broker": { status: "optimal", message: "Events published for async fan-out to multiple independent consumers." },
    worker: { status: "warning", message: "API calling a worker directly bypasses the queue's buffering benefit." },
    api: { status: "acceptable", message: "Service-to-service call. Fine for small systems, watch for tight coupling." },
  },
  cache: {
    database: { status: "warning", message: "Cache should sit in front of reads, not write through directly." },
  },
  queue: {
    worker: { status: "optimal", message: "Workers consume asynchronously, smoothing traffic spikes." },
    database: { status: "error", message: "Queues should feed workers, not connect directly to a database." },
  },
  "message-broker": {
    worker: { status: "optimal", message: "Workers consume published events asynchronously." },
    database: { status: "error", message: "Brokers should feed consumers, not connect directly to a database." },
  },
  worker: {
    database: { status: "acceptable", message: "Worker persists results to the database." },
    cache: { status: "acceptable", message: "Worker writes results to cache." },
    "object-storage": { status: "acceptable", message: "Worker writes processed files to blob storage." },
  },
};

const DEFAULT_EVALUATION: ConnectionEvaluation = {
  status: "acceptable",
  message: "Unusual connection. It may work, but isn't a common pattern.",
};

export function evaluateConnection(
  sourceType: ComponentType,
  targetType: ComponentType
): ConnectionEvaluation {
  return CONNECTION_RULES[sourceType]?.[targetType] ?? DEFAULT_EVALUATION;
}

export interface GraphNode {
  id: string;
  data: SystemComponent;
}

export interface GraphEdge {
  source: string;
  target: string;
  data?: { severed?: boolean; status?: ConnectionStatus; message?: string };
}

export interface AvailabilityBreakdown {
  baselinePct: number;
  deadNodeCount: number;
  deadNodePenaltyPct: number;
  capPenaltyPct: number;
}

export interface SystemMetrics {
  rps: number;
  latencyMs: number;
  costPerMonth: number;
  availabilityPct: number;
  availabilityBreakdown: AvailabilityBreakdown;
  bottleneckNodeId: string | null;
  /** Every node currently at capacity, not just the single worst one. */
  saturatedNodeIds: string[];
}

const ZERO_AVAILABILITY_BREAKDOWN: AvailabilityBreakdown = {
  baselinePct: 0,
  deadNodeCount: 0,
  deadNodePenaltyPct: 0,
  capPenaltyPct: 0,
};

const ZERO_METRICS: SystemMetrics = {
  rps: 0,
  latencyMs: 0,
  costPerMonth: 0,
  availabilityPct: 0,
  availabilityBreakdown: ZERO_AVAILABILITY_BREAKDOWN,
  bottleneckNodeId: null,
  saturatedNodeIds: [],
};

// CAP theorem tradeoff: dialing a database toward "strong" consistency adds
// synchronous replication/quorum overhead (latency) and makes it more likely
// to reject requests during a partition (availability).
const CAP_MAX_LATENCY_MULTIPLIER = 0.5; // up to +50% latency at consistency=100
const CAP_MAX_AVAILABILITY_PENALTY = 4; // up to -4 points per database node

function effectiveLatencyMs(node: GraphNode): number {
  const base = getEffectiveLatencyMs(node.data);
  if (node.data.type !== "database") return base;
  const consistency = node.data.consistency ?? 50;
  return base * (1 + (consistency / 100) * CAP_MAX_LATENCY_MULTIPLIER);
}

// A node "counts" toward availability only if it's actually wired into the
// design (has at least one edge, healthy or severed). A component dropped on
// the canvas but never connected to anything was never part of the running
// system, so killing it shouldn't move the availability number.
export function connectedNodeIds(edges: GraphEdge[]): Set<string> {
  const ids = new Set<string>();
  for (const edge of edges) {
    ids.add(edge.source);
    ids.add(edge.target);
  }
  return ids;
}

function capAvailabilityPenalty(nodes: GraphNode[], connectedIds: Set<string>): number {
  return nodes
    .filter((n) => n.data.type === "database" && n.data.health !== "dead" && connectedIds.has(n.id))
    .reduce((sum, n) => sum + ((n.data.consistency ?? 50) / 100) * CAP_MAX_AVAILABILITY_PENALTY, 0);
}

function sumCost(nodes: GraphNode[], provider: CloudProvider): number {
  return nodes.reduce(
    (sum, n) => sum + getEffectiveBaseCost(n.data) * getProviderCostMultiplier(n.data.type, n.data.variant, provider),
    0
  );
}

// --- Max-flow (Edmonds-Karp) over a node-capacity-constrained network -----
// Each node is split into an "_in" and "_out" vertex joined by an edge whose
// capacity is the node's maxRps -- this is what lets fan-out (e.g. a load
// balancer to several API replicas) actually sum capacity instead of being
// bounded by a single path, while shared downstream nodes (e.g. one
// database) still correctly cap the total.
type FlowGraph = Map<string, Map<string, number>>;

function addFlowEdge(graph: FlowGraph, u: string, v: string, cap: number) {
  if (!graph.has(u)) graph.set(u, new Map());
  if (!graph.has(v)) graph.set(v, new Map());
  graph.get(u)!.set(v, (graph.get(u)!.get(v) ?? 0) + cap);
  if (!graph.get(v)!.has(u)) graph.get(v)!.set(u, 0);
}

function bfsAugmentingPath(graph: FlowGraph, source: string, sink: string): string[] | null {
  const parent = new Map<string, string>();
  const visited = new Set([source]);
  const queue: string[] = [source];

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === sink) break;
    for (const [v, cap] of graph.get(u) ?? []) {
      if (cap > 0 && !visited.has(v)) {
        visited.add(v);
        parent.set(v, u);
        queue.push(v);
      }
    }
  }

  if (!visited.has(sink)) return null;

  const path = [sink];
  let cur = sink;
  while (cur !== source) {
    cur = parent.get(cur)!;
    path.push(cur);
  }
  return path.reverse();
}

function maxFlow(graph: FlowGraph, source: string, sink: string): number {
  let flow = 0;
  let path: string[] | null;
  // Guard against pathological infinite-capacity loops; a real graph here
  // never needs more than a few hundred augmenting paths.
  let iterations = 0;
  while ((path = bfsAugmentingPath(graph, source, sink)) && iterations < 1000) {
    iterations += 1;
    let bottleneck = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      bottleneck = Math.min(bottleneck, graph.get(path[i])!.get(path[i + 1])!);
    }
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      graph.get(u)!.set(v, graph.get(u)!.get(v)! - bottleneck);
      graph.get(v)!.set(u, (graph.get(v)!.get(u) ?? 0) + bottleneck);
    }
    flow += bottleneck;
  }
  return flow;
}

/**
 * Traverses the graph from entry nodes (clients, or nodes with no incoming
 * edge if no client is present) to compute the true critical path (longest
 * cumulative latency chain) and true system throughput via max-flow over a
 * node-capacity-constrained network, so horizontal scaling (fan-out to
 * multiple replicas) is correctly rewarded and shared bottlenecks are
 * correctly enforced. Severed edges (simulated network partitions) and dead
 * nodes are excluded entirely.
 */
export function calculateSystemMetrics(
  nodes: GraphNode[],
  edges: GraphEdge[],
  provider: CloudProvider = "generic",
  demandCapRps?: number
): SystemMetrics {
  if (nodes.length === 0) return ZERO_METRICS;

  const aliveNodes = nodes.filter((n) => n.data.health !== "dead");
  if (aliveNodes.length === 0) {
    return { ...ZERO_METRICS, costPerMonth: sumCost(nodes, provider) };
  }

  const aliveIds = new Set(aliveNodes.map((n) => n.id));
  const nodesById = new Map(nodes.map((n) => [n.id, n]));

  const outgoing = new Map<string, string[]>();
  const hasIncoming = new Set<string>();
  for (const edge of edges) {
    if (edge.data?.severed) continue;
    if (!aliveIds.has(edge.source) || !aliveIds.has(edge.target)) continue;
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    hasIncoming.add(edge.target);
  }

  // Prefer client nodes as entry points. Only fall back to "root" nodes
  // (no incoming edge, but at least one outgoing edge) when there's no
  // client at all, so an isolated, unconnected node never counts as its
  // own entry point.
  const clientEntryIds = aliveNodes.filter((n) => n.data.type === "client").map((n) => n.id);
  const entryIds =
    clientEntryIds.length > 0
      ? clientEntryIds
      : aliveNodes
          .filter((n) => !hasIncoming.has(n.id) && outgoing.has(n.id))
          .map((n) => n.id);

  // Longest-path latency (critical path) via DFS, guarding against cycles.
  let latencyMs = 0;
  const reachable = new Set<string>();

  function dfs(nodeId: string, accLatency: number, pathVisited: Set<string>) {
    reachable.add(nodeId);
    const node = nodesById.get(nodeId)!;
    const totalLatency = accLatency + (node.data.type === "client" ? 0 : effectiveLatencyMs(node));
    latencyMs = Math.max(latencyMs, totalLatency);

    for (const nextId of outgoing.get(nodeId) ?? []) {
      if (pathVisited.has(nextId)) continue; // cycle guard
      dfs(nextId, totalLatency, new Set(pathVisited).add(nextId));
    }
  }

  for (const entryId of entryIds) {
    dfs(entryId, 0, new Set([entryId]));
  }

  const reachableNonClientIds = [...reachable].filter(
    (id) => nodesById.get(id)!.data.type !== "client"
  );

  let rps = 0;
  let bottleneckNodeId: string | null = null;
  let saturatedNodeIds: string[] = [];

  if (reachableNonClientIds.length > 0) {
    const graph: FlowGraph = new Map();
    const SRC = "__source__";
    const SINK = "__sink__";

    for (const id of reachable) {
      const node = nodesById.get(id)!;
      addFlowEdge(graph, `${id}_in`, `${id}_out`, getEffectiveMaxRps(node.data));
    }
    for (const [u, targets] of outgoing) {
      if (!reachable.has(u)) continue;
      for (const v of targets) {
        if (!reachable.has(v)) continue;
        addFlowEdge(graph, `${u}_out`, `${v}_in`, Infinity);
      }
    }
    const entryCap = demandCapRps !== undefined ? Math.max(0, demandCapRps) : Infinity;
    for (const id of entryIds) {
      if (reachable.has(id)) addFlowEdge(graph, SRC, `${id}_in`, entryCap);
    }
    for (const id of reachableNonClientIds) {
      const hasOutgoingWithinReachable = (outgoing.get(id) ?? []).some((v) => reachable.has(v));
      if (!hasOutgoingWithinReachable) addFlowEdge(graph, `${id}_out`, SINK, Infinity);
    }

    rps = maxFlow(graph, SRC, SINK);

    const saturated = reachableNonClientIds.filter((id) => {
      const remaining = graph.get(`${id}_in`)?.get(`${id}_out`) ?? Infinity;
      return remaining <= 0;
    });
    saturatedNodeIds = saturated;
    if (saturated.length > 0) {
      bottleneckNodeId = saturated.reduce((min, id) =>
        getEffectiveMaxRps(nodesById.get(id)!.data) < getEffectiveMaxRps(nodesById.get(min)!.data) ? id : min
      );
    }
  }

  const costPerMonth = sumCost(nodes, provider);

  const connectedIds = connectedNodeIds(edges);
  const connectedNodes = nodes.filter((n) => connectedIds.has(n.id));
  const deadCount = connectedNodes.filter((n) => n.data.health === "dead").length;
  const baseAvailability =
    connectedNodes.length === 0 || deadCount === 0
      ? 99.99
      : Math.max(0, 99.99 - deadCount * (99.99 / connectedNodes.length));
  const capPenalty = capAvailabilityPenalty(nodes, connectedIds);
  const availabilityPct = Math.max(0, baseAvailability - capPenalty);
  const availabilityBreakdown: AvailabilityBreakdown = {
    baselinePct: 99.99,
    deadNodeCount: deadCount,
    deadNodePenaltyPct: Math.round((99.99 - baseAvailability) * 100) / 100,
    capPenaltyPct: Math.round(capPenalty * 100) / 100,
  };

  return {
    rps,
    latencyMs: Math.round(latencyMs * 10) / 10,
    costPerMonth: Math.round(costPerMonth),
    availabilityPct,
    availabilityBreakdown,
    bottleneckNodeId,
    saturatedNodeIds,
  };
}

// Shared concept-tag metadata, derived from which objective ids a level
// contains. Used by both the skill map (to show what each level teaches)
// and the post-level debrief (to explain why it matters and prompt
// follow-up thinking) -- authored once per concept instead of once per
// level, since the same handful of concepts recur across all 60 levels.

export interface ConceptInfo {
  label: string;
  realWorld: string;
  followUps: string[];
}

// Maps a literal objective id (as used in lib/campaign.ts) to the concept
// tag it demonstrates. Objective ids are a small, fixed set even though
// they're reused across 60 levels.
export const TAG_BY_OBJECTIVE_ID: Record<string, string> = {
  "add-cdn": "cdn",
  "add-load-balancer": "load-balancing",
  "add-api-gateway": "api-gateway",
  "add-cache": "caching",
  "add-object-storage": "object-storage",
  "add-queue": "async-processing",
  "add-message-broker": "pubsub",
  "fan-out": "pubsub",
  "add-database-replica": "read-replicas",
  "use-nosql": "sql-vs-nosql",
  "use-graphql": "api-protocols",
  "strong-consistency": "cap-theorem",
  "no-spof": "high-availability",
  budget: "cost-optimization",
  "add-two-apis": "horizontal-scaling",
  "add-three-apis": "horizontal-scaling",
  "no-bad-connections": "design-patterns",
};

export const CONCEPTS: Record<string, ConceptInfo> = {
  cdn: {
    label: "CDN / Edge Caching",
    realWorld:
      "Netflix, YouTube, and every major news site push video and static assets through a CDN so a user in Tokyo isn't fetching a file from a server in Virginia.",
    followUps: [
      "What happens when a CDN's cached copy of a file goes stale?",
      "How would you invalidate a cached asset across hundreds of edge locations at once?",
    ],
  },
  "load-balancing": {
    label: "Load Balancing",
    realWorld:
      "Any service with more than one server instance -- which is nearly every production service at scale -- sits behind a load balancer to spread traffic and route around unhealthy instances.",
    followUps: [
      "What load balancing algorithm would you pick, and why?",
      "What happens to in-flight requests when a load balancer takes an instance out of rotation?",
    ],
  },
  "api-gateway": {
    label: "API Gateway",
    realWorld:
      "Amazon API Gateway, Kong, and Apigee exist because every public API needs one consistent place to handle auth, rate limiting, and routing before requests hit internal services.",
    followUps: [
      "Why not just put auth logic inside every individual service?",
      "What's the downside of routing all traffic through a single gateway?",
    ],
  },
  caching: {
    label: "Caching",
    realWorld:
      "Redis and Memcached sit in front of databases at nearly every company with real read traffic -- Twitter, Reddit, and Instagram all lean on caching to keep feeds fast.",
    followUps: [
      "How do you keep a cache from serving stale data right after a write?",
      "What happens to your database when the cache is cold right after a deploy?",
    ],
  },
  "object-storage": {
    label: "Object Storage",
    realWorld:
      "S3, Cloud Storage, and Azure Blob Storage exist because relational databases are a poor fit for large binary files -- every photo, video, and file upload product uses one.",
    followUps: [
      "Why not store images directly as blobs in the database?",
      "How would you let a user download a private file without exposing your storage bucket publicly?",
    ],
  },
  "async-processing": {
    label: "Async Processing",
    realWorld:
      "Queues like SQS and RabbitMQ let services like a ride-matching app accept a request instantly while the actual heavy work happens seconds later in the background.",
    followUps: [
      "What happens to a job if the worker processing it crashes mid-task?",
      "How do you guarantee a job isn't accidentally processed twice?",
    ],
  },
  pubsub: {
    label: "Pub/Sub Fan-Out",
    realWorld:
      "Kafka and Pub/Sub let one event -- like \"order placed\" -- trigger several independent, unrelated systems (billing, shipping, analytics) without any of them knowing about each other.",
    followUps: [
      "What happens if one consumer falls behind the others?",
      "How is a message broker different from a plain queue?",
    ],
  },
  "read-replicas": {
    label: "Read Replicas",
    realWorld:
      "Nearly every database-backed service at scale runs one primary for writes and several read replicas, since reads usually outnumber writes by 10-100x.",
    followUps: [
      "What can go wrong if your app reads from a replica immediately after writing to the primary?",
      "How would you fail over if the primary database died?",
    ],
  },
  "sql-vs-nosql": {
    label: "SQL vs NoSQL",
    realWorld:
      "A social feed often uses a wide-column or document store for write volume and flexible schema, while a bank's core ledger stays on a relational database because it needs real transactions.",
    followUps: [
      "What do you give up by moving from a relational database to NoSQL?",
      "When would a single system reasonably use both?",
    ],
  },
  "api-protocols": {
    label: "API Protocols",
    realWorld:
      "GraphQL was built specifically because mobile apps were making dozens of REST calls to assemble one screen; gRPC is the default for internal service-to-service calls at many large tech companies.",
    followUps: [
      "Why is GraphQL harder to cache at the HTTP layer than REST?",
      "When would gRPC be the wrong choice for an API?",
    ],
  },
  "cap-theorem": {
    label: "CAP Theorem",
    realWorld:
      "A banking ledger favors consistency -- no stale balances, ever. A social media like-counter favors availability -- a slightly-off count is fine, but downtime isn't.",
    followUps: [
      "Can a system have both consistency and availability during a network partition?",
      "Give an example where eventual consistency would be completely unacceptable.",
    ],
  },
  "high-availability": {
    label: "High Availability",
    realWorld:
      "Every system with an uptime guarantee is designed assuming hardware WILL fail -- the question isn't if a server dies, it's whether users ever notice.",
    followUps: [
      "What's the difference between redundancy and automatic failover?",
      "How would you actually test that your system survives a failure, instead of just assuming it does?",
    ],
  },
  "cost-optimization": {
    label: "Cost Optimization",
    realWorld:
      "Companies routinely over-provision \"just in case,\" then get a surprise cloud bill -- knowing where redundancy actually matters, versus where it's wasted spend, is a real skill.",
    followUps: [
      "If your budget was cut in half, where would you remove redundancy first, and why there?",
      "When does scaling horizontally stop being cheaper than scaling vertically?",
    ],
  },
  "horizontal-scaling": {
    label: "Horizontal Scaling",
    realWorld:
      "Adding more machines instead of one bigger machine is how large-scale web services handle growth -- it's usually cheaper and has no hard ceiling, unlike scaling vertically.",
    followUps: [
      "What has to be true about your application for it to scale horizontally at all?",
      "Describe a stateful design that would make horizontal scaling hard.",
    ],
  },
  "design-patterns": {
    label: "Design Patterns & Anti-Patterns",
    realWorld:
      "Recognizing a connection that technically works but skips an intended benefit -- like an API calling a worker directly instead of going through a queue -- is exactly what interviewers are listening for.",
    followUps: [
      "Why might a connection \"work\" in a demo but still be the wrong call in production?",
      "What's the real cost of taking a shortcut like this at scale?",
    ],
  },
};

export function getLevelTags(objectiveIds: string[]): string[] {
  const tags = new Set<string>();
  for (const id of objectiveIds) {
    const tag = TAG_BY_OBJECTIVE_ID[id];
    if (tag) tags.add(tag);
  }
  return Array.from(tags);
}

// The glossary: every system design concept the app touches, organized by
// category. Doubles as the source for the post-level debrief and the skill
// map's concept tags (via TAG_BY_OBJECTIVE_ID / getLevelTags below), and as
// the full standalone glossary browsed via GlossaryPanel / app/glossary.
//
// Authored once per concept -- not once per level -- since the same
// handful of ideas recur across all 60+ levels. Each entry is deliberately
// short-to-deep: a one-line definition first, a fuller explanation second,
// grounded in a real system, plus a common misconception ("gotcha") and a
// couple of follow-up questions worth turning over in your head.

export type GlossaryCategory =
  | "Fundamentals"
  | "Scaling & Performance"
  | "Data & Storage"
  | "Messaging & Communication"
  | "Reliability & Availability"
  | "APIs & Protocols"
  | "Architecture Patterns";

export const GLOSSARY_CATEGORY_ORDER: GlossaryCategory[] = [
  "Fundamentals",
  "Scaling & Performance",
  "Data & Storage",
  "Messaging & Communication",
  "APIs & Protocols",
  "Reliability & Availability",
  "Architecture Patterns",
];

export interface ConceptInfo {
  label: string;
  category: GlossaryCategory;
  /** One sentence -- the "simple" version. */
  shortDefinition: string;
  /** Two to four sentences -- the "in depth" version. */
  definition: string;
  realWorld: string;
  /** A common misconception or interview pitfall tied to this concept. */
  gotcha: string;
  followUps: string[];
}

// Maps a literal objective id (as used in lib/campaign.ts) to the glossary
// entry it demonstrates. Objective ids are a small, fixed set even though
// they're reused across 60+ levels.
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
  // ---------------------------------------------------------------------
  // Fundamentals
  // ---------------------------------------------------------------------
  "client-server": {
    label: "Client-Server Model",
    category: "Fundamentals",
    shortDefinition: "A client requests, a server responds -- the basic shape almost every system builds on.",
    definition:
      "The client (a browser, a mobile app, another service) initiates a request; the server holds the logic and data and returns a response. Nearly every architecture in this app is a variation on this pattern, layered with more clients, more servers, and things in between.",
    realWorld:
      "Every app you've ever used is a client talking to a server -- the interesting design decisions are all about what sits between them and how the server side is built.",
    gotcha: "\"Serverless\" doesn't mean there's no server -- it means you don't manage the server yourself.",
    followUps: [
      "What has to be true for a client to trust a server's response?",
      "Where does a peer-to-peer system break this model?",
    ],
  },
  "latency-vs-throughput": {
    label: "Latency vs Throughput",
    category: "Fundamentals",
    shortDefinition: "Latency is how long one request takes; throughput is how many requests you can handle per second.",
    definition:
      "These two numbers can move independently, and optimizing for one can hurt the other. A system can have very low latency but low throughput (a single fast worker), or high throughput but higher latency (batching requests together to process more of them, at the cost of each one waiting slightly longer).",
    realWorld:
      "A video call needs low latency above all -- a half-second delay is noticeable. A nightly batch analytics job needs high throughput -- nobody cares if any single record takes an extra millisecond.",
    gotcha: "Adding more servers raises throughput, but doesn't necessarily lower latency for any single request -- it just lets you handle more of them at once.",
    followUps: [
      "Which metric matters more for a chat app? For a data pipeline?",
      "How could batching requests together improve throughput while making latency worse?",
    ],
  },
  scalability: {
    label: "Scalability",
    category: "Fundamentals",
    shortDefinition: "A system's ability to handle growing load by adding resources, without a redesign.",
    definition:
      "A scalable system handles 10x the traffic by adding more capacity (bigger or more machines), not by being rewritten. The two levers are vertical scaling (a bigger machine) and horizontal scaling (more machines) -- see both below.",
    realWorld:
      "A startup's MVP might run on one server just fine. The system design problem starts the moment that one server can't keep up -- that's the whole premise of this app's guided levels.",
    gotcha: "Scalability isn't free -- every lever (caching, replicas, load balancers) adds moving parts and failure modes you didn't have before.",
    followUps: [
      "What's the simplest possible change that buys you more headroom before a full redesign?",
      "Can a system be scalable but not reliable? Give an example.",
    ],
  },
  availability: {
    label: "Availability",
    category: "Fundamentals",
    shortDefinition: "The percentage of time a system is up and successfully serving requests.",
    definition:
      "Usually expressed in \"nines\" -- 99.9% availability (\"three nines\") allows about 8.7 hours of downtime a year; 99.99% (\"four nines\") allows about 52 minutes. Each additional nine is disproportionately harder and more expensive to achieve.",
    realWorld:
      "This app's MetricsHUD shows a live availability percentage, penalized by dead nodes and by how strongly-consistent your databases are dialed -- a direct, visible trade-off rather than an abstract number.",
    gotcha: "High availability and zero downtime aren't the same thing -- 99.99% still allows real outages, just short and infrequent ones.",
    followUps: [
      "How would you design for 99.99% availability differently than 99%?",
      "What's the cost curve of chasing each additional nine?",
    ],
  },
  "sla-slo-sli": {
    label: "SLA, SLO, and SLI",
    category: "Fundamentals",
    shortDefinition: "SLI is what you measure, SLO is your internal target, SLA is the promise you make externally.",
    definition:
      "A Service Level Indicator (SLI) is a measured metric, like p99 latency or error rate. A Service Level Objective (SLO) is the internal target for that metric, like \"p99 latency under 200ms.\" A Service Level Agreement (SLA) is the external, often contractual, promise -- usually looser than the SLO, so you breach your own target before you breach a customer's contract.",
    realWorld:
      "Cloud providers publish SLAs (like 99.9% uptime) with real financial penalties if they're missed -- which is why their internal SLOs are set stricter than what they promise publicly.",
    gotcha: "Setting your SLA equal to your SLO leaves no safety margin -- a single bad day breaches a contract, not just an internal goal.",
    followUps: [
      "Why would a company deliberately set its SLA looser than its SLO?",
      "What SLI would you track for a payments API versus a social feed?",
    ],
  },

  // ---------------------------------------------------------------------
  // Scaling & Performance
  // ---------------------------------------------------------------------
  "vertical-scaling": {
    label: "Vertical Scaling",
    category: "Scaling & Performance",
    shortDefinition: "Making a single machine bigger -- more CPU, RAM, or disk.",
    definition:
      "The simplest scaling lever: upgrade the box. It requires no architectural changes, but it has a hard ceiling (there's a biggest machine you can buy) and creates a single point of failure -- if that one bigger machine dies, everything on it dies with it.",
    realWorld:
      "A single-instance database (the default in this app's Database component) is vertically scaled -- you can upgrade its size, but there's still exactly one of it.",
    gotcha: "Vertical scaling is often the right FIRST move (it's simple and cheap at small scale) -- horizontal scaling isn't automatically the \"correct\" answer just because it's more sophisticated.",
    followUps: [
      "At what point does vertical scaling stop being viable?",
      "Why is a vertically-scaled component always a single point of failure?",
    ],
  },
  "horizontal-scaling": {
    label: "Horizontal Scaling",
    category: "Scaling & Performance",
    shortDefinition: "Adding more machines instead of a bigger one, and spreading load across them.",
    definition:
      "Adding more machines instead of one bigger machine is how large-scale web services handle growth -- it's usually cheaper at scale and has no hard ceiling, unlike vertical scaling. It requires something to distribute work across the fleet (a load balancer) and, if the machines hold state, a way to keep that state consistent or partitioned.",
    realWorld:
      "Adding more machines instead of one bigger machine is how large-scale web services handle growth -- it's usually cheaper and has no hard ceiling, unlike scaling vertically.",
    gotcha: "Horizontal scaling only works cleanly for stateless components. A stateful service (like a database) needs replication or sharding, not just \"add more instances.\"",
    followUps: [
      "What has to be true about your application for it to scale horizontally at all?",
      "Describe a stateful design that would make horizontal scaling hard.",
    ],
  },
  "load-balancing": {
    label: "Load Balancing",
    category: "Scaling & Performance",
    shortDefinition: "Distributing incoming requests across multiple servers so no single one is overwhelmed.",
    definition:
      "Any service with more than one server instance -- which is nearly every production service at scale -- sits behind a load balancer to spread traffic and route around unhealthy instances. Common algorithms include round robin (rotate evenly), least connections (send to whichever server is least busy), and consistent hashing (send the same client to the same server, useful for caching or session affinity).",
    realWorld:
      "Any service with more than one server instance -- which is nearly every production service at scale -- sits behind a load balancer to spread traffic and route around unhealthy instances.",
    gotcha: "A load balancer that's a single instance is itself a new single point of failure -- production setups usually run redundant load balancers behind a DNS or anycast layer.",
    followUps: [
      "What load balancing algorithm would you pick, and why?",
      "What happens to in-flight requests when a load balancer takes an instance out of rotation?",
    ],
  },
  caching: {
    label: "Caching",
    category: "Scaling & Performance",
    shortDefinition: "Storing a copy of frequently-read data somewhere faster than its original source.",
    definition:
      "Redis and Memcached sit in front of databases at nearly every company with real read traffic -- Twitter, Reddit, and Instagram all lean on caching to keep feeds fast. The hard part isn't storing data in memory -- it's cache invalidation: knowing when the cached copy is stale and needs to be refreshed or evicted.",
    realWorld:
      "Redis and Memcached sit in front of databases at nearly every company with real read traffic -- Twitter, Reddit, and Instagram all lean on caching to keep feeds fast.",
    gotcha: "\"There are only two hard things in computer science: cache invalidation and naming things\" is a joke because it's true -- a stale cache is often worse than no cache at all.",
    followUps: [
      "How do you keep a cache from serving stale data right after a write?",
      "What happens to your database when the cache is cold right after a deploy?",
    ],
  },
  cdn: {
    label: "CDN (Content Delivery Network)",
    category: "Scaling & Performance",
    shortDefinition: "A network of edge servers that cache and serve static content close to the user.",
    definition:
      "Netflix, YouTube, and every major news site push video and static assets through a CDN so a user in Tokyo isn't fetching a file from a server in Virginia. A CDN is really just caching applied geographically -- the same invalidation problems apply, at a larger scale and with more physical distance involved.",
    realWorld:
      "Netflix, YouTube, and every major news site push video and static assets through a CDN so a user in Tokyo isn't fetching a file from a server in Virginia.",
    gotcha: "A CDN helps with static or rarely-changing content -- it does nothing for highly personalized or real-time dynamic content, which still has to hit your origin.",
    followUps: [
      "What happens when a CDN's cached copy of a file goes stale?",
      "How would you invalidate a cached asset across hundreds of edge locations at once?",
    ],
  },
  "rate-limiting": {
    label: "Rate Limiting",
    category: "Scaling & Performance",
    shortDefinition: "Capping how many requests a client can make in a given time window.",
    definition:
      "Protects a service from being overwhelmed -- by a bug, a bad actor, or an unexpectedly popular integration -- by rejecting or delaying requests past a threshold. Common algorithms include token bucket (a refilling budget of allowed requests) and sliding window (count requests in a rolling time frame).",
    realWorld:
      "Public APIs like Twitter's or Stripe's return a 429 \"Too Many Requests\" response once you exceed your plan's rate limit -- this app's API Gateway component has a \"Rate Limiting\" variant that models exactly this trade-off (protection at the cost of some added latency).",
    gotcha: "Rate limiting the wrong dimension (by IP instead of by API key, for example) can accidentally throttle many legitimate users behind one shared IP, like an office network.",
    followUps: [
      "Token bucket vs. sliding window -- what's the practical difference to a client?",
      "How would you rate-limit fairly across thousands of tenants sharing one API?",
    ],
  },

  // ---------------------------------------------------------------------
  // Data & Storage
  // ---------------------------------------------------------------------
  "sql-vs-nosql": {
    label: "SQL vs NoSQL",
    category: "Data & Storage",
    shortDefinition: "Relational databases enforce structure and relationships; NoSQL trades that for flexibility and scale.",
    definition:
      "A social feed often uses a wide-column or document store for write volume and flexible schema, while a bank's core ledger stays on a relational database because it needs real transactions. SQL databases give you joins, ACID transactions, and a rigid schema that catches bad data early. NoSQL databases (document, key-value, wide-column, graph) trade some of those guarantees for horizontal scalability and a schema that can evolve without a migration.",
    realWorld:
      "A social feed often uses a wide-column or document store for write volume and flexible schema, while a bank's core ledger stays on a relational database because it needs real transactions.",
    gotcha: "\"NoSQL is more scalable\" is a half-truth -- modern SQL databases can scale horizontally too (with more effort); the real trade-off is schema flexibility and transaction guarantees, not raw scalability.",
    followUps: [
      "What do you give up by moving from a relational database to NoSQL?",
      "When would a single system reasonably use both?",
    ],
  },
  "database-sharding": {
    label: "Database Sharding",
    category: "Data & Storage",
    shortDefinition: "Splitting a database's data across multiple machines, each holding a subset.",
    definition:
      "Where a read replica copies the SAME data to more machines (for read scaling), sharding splits DIFFERENT data across machines (for write scaling and storage that exceeds one machine's capacity). Each shard holds a slice of the data, usually partitioned by a key like user ID or region.",
    realWorld:
      "A messaging platform with billions of users might shard by user ID, so each shard only has to handle a fraction of the total write volume -- no single database instance could hold or serve all of it.",
    gotcha: "Choosing a bad shard key (like sharding by signup date, when all your traffic is on the newest shard) creates a \"hot shard\" that defeats the whole point of sharding.",
    followUps: [
      "What makes a shard key good versus bad?",
      "How would you handle a query that needs data from multiple shards at once?",
    ],
  },
  "database-replication": {
    label: "Database Replication & Read Replicas",
    category: "Data & Storage",
    shortDefinition: "Copying a database's data to additional machines to scale reads and add redundancy.",
    definition:
      "Nearly every database-backed service at scale runs one primary for writes and several read replicas, since reads usually outnumber writes by 10-100x. Replication is usually asynchronous, which means replicas can lag slightly behind the primary -- the core trade-off behind eventual consistency.",
    realWorld:
      "Nearly every database-backed service at scale runs one primary for writes and several read replicas, since reads usually outnumber writes by 10-100x.",
    gotcha: "Reading from a replica immediately after writing to the primary can return stale data if replication hasn't caught up yet -- a classic \"my update disappeared\" bug that isn't really a bug.",
    followUps: [
      "What can go wrong if your app reads from a replica immediately after writing to the primary?",
      "How would you fail over if the primary database died?",
    ],
  },
  "consistent-hashing": {
    label: "Consistent Hashing",
    category: "Data & Storage",
    shortDefinition: "A hashing scheme that minimizes redistribution when servers are added or removed.",
    definition:
      "With naive hashing (like `server = hash(key) % N`), adding or removing one server reshuffles almost every key's assignment. Consistent hashing arranges servers and keys on a conceptual ring, so adding or removing a server only affects the keys immediately adjacent to it on the ring -- everything else stays put.",
    realWorld:
      "Distributed caches and load balancers use consistent hashing so that scaling the fleet up or down doesn't invalidate almost the entire cache at once.",
    gotcha: "Plain consistent hashing can still create hot spots if keys aren't evenly distributed -- production systems usually add \"virtual nodes\" (each server appears at multiple ring positions) to smooth this out.",
    followUps: [
      "Why does naive modulo hashing fall apart when you add a server?",
      "What problem do virtual nodes solve on the hash ring?",
    ],
  },
  "data-partitioning": {
    label: "Data Partitioning",
    category: "Data & Storage",
    shortDefinition: "Dividing a large dataset into smaller, more manageable, independently-servable chunks.",
    definition:
      "The general term that sharding (partitioning by key across databases) is a specific case of. Partitioning can happen by range (all of January's data in one partition), by hash (partition = hash(key) % N), or by a directory/lookup service that tracks where each piece of data lives.",
    realWorld:
      "A time-series database like the ones used for monitoring metrics often partitions by time range, so old data can be cheaply archived or deleted without touching recent, actively-queried partitions.",
    gotcha: "Range partitioning is easy to reason about but prone to hot spots (all of \"today\" hits one partition); hash partitioning spreads load evenly but makes range queries across the whole dataset expensive.",
    followUps: [
      "When would you choose range partitioning over hash partitioning?",
      "How does partitioning interact with database replication -- are they the same thing?",
    ],
  },
  "cap-theorem": {
    label: "CAP Theorem",
    category: "Data & Storage",
    shortDefinition: "A distributed system can't guarantee Consistency, Availability, and Partition tolerance all at once.",
    definition:
      "A banking ledger favors consistency -- no stale balances, ever. A social media like-counter favors availability -- a slightly-off count is fine, but downtime isn't. Since network partitions are a fact of life in any real distributed system, the practical choice is really between C and A when a partition happens: reject requests to stay consistent, or keep serving and risk staleness.",
    realWorld:
      "A banking ledger favors consistency -- no stale balances, ever. A social media like-counter favors availability -- a slightly-off count is fine, but downtime isn't.",
    gotcha: "CAP theorem is about behavior DURING a network partition specifically -- a system can be both consistent and available the rest of the time. It's not a permanent, blanket trade-off.",
    followUps: [
      "Can a system have both consistency and availability during a network partition?",
      "Give an example where eventual consistency would be completely unacceptable.",
    ],
  },
  "acid-vs-base": {
    label: "ACID vs BASE",
    category: "Data & Storage",
    shortDefinition: "ACID guarantees strict transactional correctness; BASE trades that for availability and scale.",
    definition:
      "ACID (Atomicity, Consistency, Isolation, Durability) is the traditional relational-database guarantee: a transaction either fully happens or fully doesn't, and the database never shows you an in-between state. BASE (Basically Available, Soft state, Eventually consistent) is the looser guarantee many distributed/NoSQL systems make instead, prioritizing uptime and scale over strict, immediate correctness.",
    realWorld:
      "A payment processor's ledger needs ACID transactions -- a debit and a credit must happen together or not at all. A \"likes\" counter can be BASE -- it'll settle to the right number eventually, and nobody will notice a one-second delay.",
    gotcha: "BASE doesn't mean \"no guarantees\" -- it means the guarantees are weaker and delayed, not absent. Data does eventually become consistent; it just isn't instant.",
    followUps: [
      "Why can't a system easily be both strictly ACID and horizontally scaled across many nodes?",
      "Name a feature in a real app where BASE semantics would be a bad fit.",
    ],
  },
  "object-storage": {
    label: "Object Storage",
    category: "Data & Storage",
    shortDefinition: "Storage designed for large binary files (blobs), addressed by key rather than a file path or query.",
    definition:
      "S3, Cloud Storage, and Azure Blob Storage exist because relational databases are a poor fit for large binary files -- every photo, video, and file upload product uses one. Object storage trades the fine-grained querying of a database for durability, near-infinite scale, and low cost per gigabyte.",
    realWorld:
      "S3, Cloud Storage, and Azure Blob Storage exist because relational databases are a poor fit for large binary files -- every photo, video, and file upload product uses one.",
    gotcha: "Object storage isn't a database replacement -- it has no query language, no joins, and (usually) no strong read-after-write consistency guarantees across regions.",
    followUps: [
      "Why not store images directly as blobs in the database?",
      "How would you let a user download a private file without exposing your storage bucket publicly?",
    ],
  },

  // ---------------------------------------------------------------------
  // Messaging & Communication
  // ---------------------------------------------------------------------
  "async-processing": {
    label: "Async Processing (Queues & Workers)",
    category: "Messaging & Communication",
    shortDefinition: "Deferring slow work to the background instead of making the caller wait for it.",
    definition:
      "Queues like SQS and RabbitMQ let services like a ride-matching app accept a request instantly while the actual heavy work happens seconds later in the background. A queue sits between the thing producing work and the worker(s) consuming it, buffering bursts and smoothing out load.",
    realWorld:
      "Queues like SQS and RabbitMQ let services like a ride-matching app accept a request instantly while the actual heavy work happens seconds later in the background.",
    gotcha: "A queue only helps if the caller genuinely doesn't need the result immediately -- queuing work you actually need synchronously just adds latency and a new failure mode.",
    followUps: [
      "What happens to a job if the worker processing it crashes mid-task?",
      "How do you guarantee a job isn't accidentally processed twice?",
    ],
  },
  pubsub: {
    label: "Publish/Subscribe (Pub/Sub) Fan-Out",
    category: "Messaging & Communication",
    shortDefinition: "One event, published once, delivered independently to every interested consumer.",
    definition:
      "Kafka and Pub/Sub let one event -- like \"order placed\" -- trigger several independent, unrelated systems (billing, shipping, analytics) without any of them knowing about each other. This differs from a plain queue, where each message is typically consumed by exactly one worker -- pub/sub is built for fan-out to many.",
    realWorld:
      "Kafka and Pub/Sub let one event -- like \"order placed\" -- trigger several independent, unrelated systems (billing, shipping, analytics) without any of them knowing about each other.",
    gotcha: "Consumers in a pub/sub system must tolerate out-of-order or duplicate delivery -- \"exactly once, in order\" is hard to guarantee and often isn't actually provided by default.",
    followUps: [
      "What happens if one consumer falls behind the others?",
      "How is a message broker different from a plain queue?",
    ],
  },
  "api-gateway": {
    label: "API Gateway",
    category: "Messaging & Communication",
    shortDefinition: "A single, managed entry point that sits in front of your internal services.",
    definition:
      "Amazon API Gateway, Kong, and Apigee exist because every public API needs one consistent place to handle auth, rate limiting, and routing before requests hit internal services. It decouples external clients from your internal service topology, so services can move or be replaced without breaking anyone calling the public API.",
    realWorld:
      "Amazon API Gateway, Kong, and Apigee exist because every public API needs one consistent place to handle auth, rate limiting, and routing before requests hit internal services.",
    gotcha: "A gateway centralizes convenience, but also centralizes risk -- if it goes down or misconfigures a rule, it can take down access to everything behind it at once.",
    followUps: [
      "Why not just put auth logic inside every individual service?",
      "What's the downside of routing all traffic through a single gateway?",
    ],
  },
  "long-polling-vs-websockets": {
    label: "Long Polling vs WebSockets",
    category: "Messaging & Communication",
    shortDefinition: "Two ways to get server-initiated updates to a client without the client repeatedly asking.",
    definition:
      "Long polling: the client sends a request, and the server holds it open until it has something to say (or a timeout hits), then the client immediately reopens it. WebSockets: a single persistent, bidirectional connection stays open, and either side can push data anytime. WebSockets are more efficient for frequent updates; long polling is simpler and works everywhere HTTP works.",
    realWorld:
      "A chat app typically uses WebSockets for real-time message delivery, since messages can arrive at any moment and reopening an HTTP connection for each one would be wasteful.",
    gotcha: "WebSockets hold a persistent connection per client, which means a server can run out of open connections long before it runs out of CPU -- it's a different scaling bottleneck than a typical stateless API.",
    followUps: [
      "Why might a company choose long polling over WebSockets even though it's less efficient?",
      "What happens to an open WebSocket connection when you need to deploy a new version of the server?",
    ],
  },

  // ---------------------------------------------------------------------
  // APIs & Protocols
  // ---------------------------------------------------------------------
  "api-protocols": {
    label: "REST vs GraphQL vs gRPC",
    category: "APIs & Protocols",
    shortDefinition: "Three different shapes for how a client asks a server for data.",
    definition:
      "GraphQL was built specifically because mobile apps were making dozens of REST calls to assemble one screen; gRPC is the default for internal service-to-service calls at many large tech companies. REST models resources as URLs with fixed responses (simple, cacheable, but can over- or under-fetch). GraphQL lets the client specify exactly the fields it wants in one request. gRPC uses a fast binary protocol (protobuf) built for low-latency service-to-service calls, with built-in support for streaming.",
    realWorld:
      "GraphQL was built specifically because mobile apps were making dozens of REST calls to assemble one screen; gRPC is the default for internal service-to-service calls at many large tech companies.",
    gotcha: "GraphQL's flexibility is also its risk -- a client can construct a single deeply-nested query that's extremely expensive for the server to resolve, unlike REST where each endpoint's cost is fixed and known.",
    followUps: [
      "Why is GraphQL harder to cache at the HTTP layer than REST?",
      "When would gRPC be the wrong choice for an API?",
    ],
  },
  idempotency: {
    label: "Idempotency",
    category: "APIs & Protocols",
    shortDefinition: "An operation that produces the same result no matter how many times it's repeated.",
    definition:
      "Critical for any API that might be retried -- and over an unreliable network, everything might be retried. \"Set balance to $100\" is idempotent (repeat it, still $100). \"Add $100 to balance\" is not (repeat it, now it's $300). APIs that accept money, orders, or other one-time actions typically require an idempotency key from the client so a retried request doesn't double-charge or double-create.",
    realWorld:
      "Payment APIs like Stripe's require an idempotency key on charge requests specifically so that a client retrying after a timeout doesn't accidentally charge a customer twice.",
    gotcha: "A request being idempotent doesn't mean it's safe to retry blindly -- you still need to actually detect the duplicate (via an idempotency key) rather than just assuming the operation is naturally repeat-safe.",
    followUps: [
      "Is a typical HTTP DELETE request idempotent? What about POST?",
      "How would you implement idempotency keys on the server side?",
    ],
  },

  // ---------------------------------------------------------------------
  // Reliability & Availability
  // ---------------------------------------------------------------------
  "high-availability": {
    label: "High Availability & Redundancy",
    category: "Reliability & Availability",
    shortDefinition: "Designing so the system keeps working even when individual components fail.",
    definition:
      "Every system with an uptime guarantee is designed assuming hardware WILL fail -- the question isn't if a server dies, it's whether users ever notice. The core technique is redundancy: no component that matters should exist as only one instance, so a failure has somewhere to fail over to.",
    realWorld:
      "Every system with an uptime guarantee is designed assuming hardware WILL fail -- the question isn't if a server dies, it's whether users ever notice.",
    gotcha: "Redundancy alone isn't high availability -- you also need automatic failover (something has to detect the failure and reroute traffic) and, ideally, a way to test it (this app's Chaos Monkey exists for exactly that reason).",
    followUps: [
      "What's the difference between redundancy and automatic failover?",
      "How would you actually test that your system survives a failure, instead of just assuming it does?",
    ],
  },
  spof: {
    label: "Single Point of Failure (SPOF)",
    category: "Reliability & Availability",
    shortDefinition: "Any component whose failure takes down the whole system.",
    definition:
      "The thing high availability design is fundamentally trying to eliminate. A component is a SPOF if there's exactly one of it and nothing else can take over its job. Redundancy doesn't automatically remove a SPOF either -- if two API servers both write to one un-replicated database, that database is still a SPOF for the whole system.",
    realWorld:
      "This app's \"no-spof\" objective on hard-tier levels literally simulates killing each component one at a time and checks whether the system keeps serving traffic -- that's the practical test for whether something is a SPOF.",
    gotcha: "Adding a second API server doesn't remove every SPOF in the system -- the load balancer routing to both of them, and the single database they both write to, are still SPOFs unless those are made redundant too.",
    followUps: [
      "Name every SPOF in a design of client -> load balancer -> 2 APIs -> 1 database.",
      "Can a system have zero SPOFs? What would that cost?",
    ],
  },
  "circuit-breaker": {
    label: "Circuit Breaker",
    category: "Reliability & Availability",
    shortDefinition: "A pattern that stops calling a failing downstream service, instead of retrying it into the ground.",
    definition:
      "Named after the electrical version: when a downstream service starts failing, the circuit \"trips\" and further calls fail fast (or fall back to a default) instead of waiting on a timeout every time and piling up retries. After a cooldown, the circuit allows a trial request through to see if the downstream service has recovered.",
    realWorld:
      "Netflix's Hystrix library popularized this pattern for microservices -- without it, one slow downstream service can cause a cascading pileup of blocked threads across every service that calls it.",
    gotcha: "Retrying a failing service more aggressively usually makes an outage worse, not better -- it adds load to an already-struggling system, which is the exact opposite of what a circuit breaker is for.",
    followUps: [
      "What should a service do while a circuit breaker is open -- fail immediately, or return a cached/default response?",
      "How is a circuit breaker different from a simple retry-with-backoff?",
    ],
  },
  backpressure: {
    label: "Backpressure",
    category: "Reliability & Availability",
    shortDefinition: "A way for a slower downstream component to signal an upstream one to slow down.",
    definition:
      "Without backpressure, a fast producer can overwhelm a slow consumer's queue until it runs out of memory or falls hopelessly behind. Backpressure mechanisms (bounded queues, explicit \"slow down\" signals, or simply rejecting new work past a threshold) let the slowest part of a pipeline set the pace for everyone upstream of it.",
    realWorld:
      "A message queue with a bounded size is a simple form of backpressure -- once it's full, producers either block or get an error, instead of the queue growing without limit until the system runs out of memory.",
    gotcha: "An unbounded queue \"feels\" more resilient because it never rejects work -- but it just delays the failure and makes it worse (an out-of-memory crash) instead of preventing it.",
    followUps: [
      "What's the trade-off between a bounded queue that rejects work and an unbounded one that doesn't?",
      "How does backpressure interact with a load balancer's health checks?",
    ],
  },
  "chaos-engineering": {
    label: "Chaos Engineering",
    category: "Reliability & Availability",
    shortDefinition: "Deliberately injecting failure into a system to verify it actually survives, instead of assuming it does.",
    definition:
      "Popularized by Netflix's Chaos Monkey (the direct inspiration for this app's own Chaos Monkey feature), the idea is simple: if you believe your system is resilient, prove it by breaking things on purpose, in a controlled way, and watching what actually happens -- rather than trusting an architecture diagram.",
    realWorld:
      "Netflix runs Chaos Monkey in production continuously, randomly terminating instances, specifically so engineers can't accidentally build systems that only work when nothing ever goes wrong.",
    gotcha: "Chaos engineering only tells you something useful if you're watching the results closely -- randomly breaking things without measuring the impact is just breaking things.",
    followUps: [
      "Why test failure in a way close to production, instead of just reading the architecture and reasoning about it?",
      "What would you want to measure while chaos-testing a payments system specifically?",
    ],
  },
  "cost-optimization": {
    label: "Cost Optimization",
    category: "Reliability & Availability",
    shortDefinition: "Getting the reliability and scale you actually need without over-provisioning for it.",
    definition:
      "Companies routinely over-provision \"just in case,\" then get a surprise cloud bill -- knowing where redundancy actually matters, versus where it's wasted spend, is a real skill. It isn't just about picking cheaper components -- it's about matching the level of redundancy and scale to what a specific part of the system actually needs.",
    realWorld:
      "Companies routinely over-provision \"just in case,\" then get a surprise cloud bill -- knowing where redundancy actually matters, versus where it's wasted spend, is a real skill.",
    gotcha: "The cheapest design and the most reliable design are both easy to build -- the actual skill (and what this app's budget-constrained levels test) is finding the balance point between them.",
    followUps: [
      "If your budget was cut in half, where would you remove redundancy first, and why there?",
      "When does scaling horizontally stop being cheaper than scaling vertically?",
    ],
  },

  // ---------------------------------------------------------------------
  // Architecture Patterns
  // ---------------------------------------------------------------------
  "monolith-vs-microservices": {
    label: "Monolith vs Microservices",
    category: "Architecture Patterns",
    shortDefinition: "One deployable codebase doing everything, versus many small independent services.",
    definition:
      "A monolith is simple to deploy and reason about, with easy in-process transactions across features -- but the whole app scales and deploys together, even for one hot endpoint. Microservices let teams deploy and scale services independently, with fault isolation between them -- at the cost of operational complexity: service discovery, network calls where function calls used to be, and distributed transactions.",
    realWorld:
      "This app's API component literally offers this as a variant choice -- Monolith (2000 rps, cheaper, simpler) versus Microservices (6000 rps, pricier, more complex) -- because it's a real trade-off, not a strictly-better upgrade.",
    gotcha: "Microservices aren't automatically the \"better\" or more scalable choice -- they trade one set of problems (a big, coupled codebase) for another (distributed systems complexity), and many companies over-adopt them before they actually need to.",
    followUps: [
      "What has to be true about your team or your traffic pattern before microservices pay off?",
      "What does a monolith gain that a microservices architecture has to work hard to get back?",
    ],
  },
  "design-patterns": {
    label: "Design Patterns & Anti-Patterns",
    category: "Architecture Patterns",
    shortDefinition: "Recurring, named solutions to common problems -- and the recurring, named mistakes that look like solutions.",
    definition:
      "Recognizing a connection that technically works but skips an intended benefit -- like an API calling a worker directly instead of going through a queue -- is exactly what interviewers are listening for. A pattern's value isn't the specific components involved, it's the reasoning behind why they're connected that way -- which is why the same handful of patterns (fan-out, cache-aside, circuit breaker) show up across completely different systems.",
    realWorld:
      "Recognizing a connection that technically works but skips an intended benefit -- like an API calling a worker directly instead of going through a queue -- is exactly what interviewers are listening for.",
    gotcha: "A pattern applied where it doesn't fit becomes an anti-pattern -- there's no such thing as a universally \"correct\" pattern independent of the actual requirements.",
    followUps: [
      "Why might a connection \"work\" in a demo but still be the wrong call in production?",
      "What's the real cost of taking a shortcut like this at scale?",
    ],
  },
  "event-driven-architecture": {
    label: "Event-Driven Architecture",
    category: "Architecture Patterns",
    shortDefinition: "Services react to events as they happen, instead of being directly called by one another.",
    definition:
      "Instead of Service A calling Service B directly (tight coupling -- A needs to know B exists), A publishes an event (\"user signed up\") and any number of services subscribe to react to it, without A knowing or caring who's listening. This is the architectural pattern that pub/sub and message brokers exist to enable.",
    realWorld:
      "An e-commerce \"order placed\" event might independently trigger inventory updates, a confirmation email, a shipping label, and an analytics update -- four teams' services, none of which need to know about each other.",
    gotcha: "Event-driven systems trade easy-to-follow control flow for loose coupling -- debugging \"what happened, and in what order\" across many independent consumers is genuinely harder than reading a single call stack.",
    followUps: [
      "What's harder to debug in an event-driven system than in a direct call chain?",
      "How would you guarantee two events about the same order are processed in the order they happened?",
    ],
  },
  cqrs: {
    label: "CQRS (Command Query Responsibility Segregation)",
    category: "Architecture Patterns",
    shortDefinition: "Using separate models -- and often separate stores -- for writing data versus reading it.",
    definition:
      "Most systems read far more than they write, and the shape of data that's efficient to write (normalized, transactional) is often not the shape that's efficient to read (denormalized, pre-aggregated). CQRS splits the two paths: commands (writes) go through one model, queries (reads) go through another, often kept in sync asynchronously.",
    realWorld:
      "A read-heavy dashboard might read from a denormalized, cache-friendly \"read model\" that's updated asynchronously from the real transactional writes, rather than running expensive joins on every page load.",
    gotcha: "CQRS adds real complexity (keeping two models in sync, usually with some lag) -- it's a tool for systems with a genuine, significant read/write asymmetry, not a default architecture to reach for.",
    followUps: [
      "How does CQRS relate to using a cache and a read replica -- is it the same idea?",
      "What happens if the read model falls behind the write model?",
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

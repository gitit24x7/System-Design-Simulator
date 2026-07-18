// Side-by-side comparison tables. Some concepts (SQL vs NoSQL, load
// balancing algorithms, consistency models) are fundamentally about
// contrasting several options against the same set of dimensions -- a table
// makes that scannable in a way prose paragraphs never quite do, even when
// the underlying content overlaps with an entry in lib/concepts.ts.

export interface ComparisonTable {
  id: string;
  title: string;
  blurb: string;
  columns: string[];
  rows: { feature: string; values: string[] }[];
}

export const COMPARISON_TABLES: ComparisonTable[] = [
  {
    id: "sql-vs-nosql-vs-newsql",
    title: "SQL vs NoSQL vs NewSQL",
    blurb: "Three broad answers to \"how do I store and query data at scale,\" each trading off differently.",
    columns: ["SQL (Relational)", "NoSQL", "NewSQL"],
    rows: [
      { feature: "Schema", values: ["Fixed, enforced upfront", "Flexible / schemaless", "Fixed, enforced upfront"] },
      { feature: "Transactions", values: ["Full ACID", "Usually BASE (eventual)", "Full ACID"] },
      { feature: "Horizontal scaling", values: ["Hard, needs manual sharding", "Built in from the start", "Built in from the start"] },
      { feature: "Joins", values: ["First-class, efficient", "Usually unsupported or app-side", "First-class, efficient"] },
      { feature: "Best fit", values: ["Complex relational data, strict correctness", "High write volume, flexible/evolving shape", "Relational guarantees at distributed scale"] },
      { feature: "Examples", values: ["PostgreSQL, MySQL", "MongoDB, DynamoDB, Cassandra", "CockroachDB, Google Spanner"] },
    ],
  },
  {
    id: "load-balancer-algorithms",
    title: "Load Balancing Algorithms",
    blurb: "How a load balancer picks which backend server gets the next request.",
    columns: ["Round Robin", "Least Connections", "Consistent Hashing"],
    rows: [
      { feature: "How it picks", values: ["Rotates evenly, in order", "Sends to the server with fewest active connections", "Same key always maps to the same server"] },
      { feature: "Needs server state?", values: ["No", "Yes -- tracks connection counts", "No -- deterministic from the key"] },
      { feature: "Handles uneven request cost", values: ["Poorly -- one slow server backs up regardless of order", "Well -- naturally avoids busy servers", "Poorly on its own -- not cost-aware"] },
      { feature: "Good for session affinity / caching", values: ["No", "No", "Yes -- same client/key keeps hitting the same server"] },
      { feature: "Rebalancing cost when a server is added/removed", values: ["N/A", "N/A", "Low -- only nearby keys on the ring move"] },
    ],
  },
  {
    id: "consistency-models",
    title: "Consistency Models",
    blurb: "How up-to-date a read is guaranteed to be relative to the most recent write, from strictest to loosest.",
    columns: ["Strong Consistency", "Read-Your-Writes", "Eventual Consistency"],
    rows: [
      { feature: "Guarantee", values: ["Every read sees the latest write, immediately", "You always see your own writes; others may lag", "All replicas converge eventually, with no timing guarantee"] },
      { feature: "Typical latency cost", values: ["Highest -- may wait on quorum/consensus", "Moderate -- routes your reads to the primary or a synced replica", "Lowest -- reads hit the nearest replica"] },
      { feature: "Availability under partition", values: ["Lowest -- may reject requests to stay correct", "Moderate", "Highest -- always answers, may be stale"] },
      { feature: "Good fit", values: ["Bank balances, inventory counts, locks", "A user's own profile edits, comments", "Like counts, view counts, presence indicators"] },
    ],
  },
];

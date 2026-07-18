// Design Critique: a rule-based "coach" that scans the current canvas and
// gives prioritized, structured feedback -- usable anytime, in Guided or
// Sandbox mode, independent of any specific level's objectives.

import {
  ComponentType,
  connectedNodeIds,
  evaluateConnection,
  GraphEdge,
  GraphNode,
  SystemMetrics,
  TYPE_LABELS,
} from "./engine";

export type CritiqueSeverity = "critical" | "warning" | "tip";

export interface CritiqueFinding {
  id: string;
  severity: CritiqueSeverity;
  title: string;
  message: string;
  /** An optional one-click way to *experience* the finding instead of just
   * reading it -- e.g. actually cool a cache down and watch the live metrics
   * react, rather than a static warning that it's load-bearing. */
  action?: {
    label: string;
    nodeId: string;
    kind: "simulate-cold-cache" | "restore-cache" | "simulate-worker-backlog" | "restore-worker";
  };
}

const SEVERITY_RANK: Record<CritiqueSeverity, number> = { critical: 0, warning: 1, tip: 2 };

function nodesOfType(nodes: GraphNode[], type: ComponentType): GraphNode[] {
  return nodes.filter((n) => n.data.type === type && n.data.health !== "dead");
}

function label(type: ComponentType): string {
  return TYPE_LABELS[type];
}

export function analyzeCritique(
  nodes: GraphNode[],
  edges: GraphEdge[],
  metrics: SystemMetrics,
  targetScaleRps?: number | null
): CritiqueFinding[] {
  const findings: CritiqueFinding[] = [];
  const alive = nodes.filter((n) => n.data.health !== "dead");

  if (alive.length === 0) {
    return [
      {
        id: "empty",
        severity: "tip",
        title: "Nothing built yet",
        message: "Start by adding a Client and something for it to talk to -- an API Server is usually the next step.",
      },
    ];
  }

  const connectedIds = connectedNodeIds(edges);
  const isolated = alive.filter((n) => n.data.type !== "client" && !connectedIds.has(n.id));
  if (isolated.length > 0) {
    findings.push({
      id: "isolated-nodes",
      severity: "warning",
      title: "Unconnected components on the canvas",
      message: `${isolated.length === 1 ? "One component isn't" : `${isolated.length} components aren't`} wired into the design (${isolated
        .map((n) => n.data.customLabel || label(n.data.type))
        .join(", ")}). A disconnected node doesn't count toward your metrics -- connect it or remove it.`,
    });
  }

  // A stated design target (from the estimate-scale step) checked against
  // what this design can actually sustain -- the "estimate scale" step made
  // load-bearing, instead of a disconnected drill you do once and forget.
  if (targetScaleRps && targetScaleRps > 0) {
    const achievable = metrics.rps;
    const ratio = achievable / targetScaleRps;
    if (ratio < 1) {
      const bottleneck = metrics.bottleneckNodeId ? nodes.find((n) => n.id === metrics.bottleneckNodeId) : null;
      const shortBy = Math.round((1 - ratio) * 100);
      findings.push({
        id: "target-scale-under",
        severity: "critical",
        title: "This design can't sustain your stated target",
        message: `You're designing for ${targetScaleRps.toLocaleString()} rps, but it currently tops out at ${achievable.toLocaleString()} rps -- ${shortBy}% short.${
          bottleneck
            ? ` ${bottleneck.data.customLabel || label(bottleneck.data.type)} is the cap; scale it (a bigger variant, a second instance, or offloading some of its work) to close the gap.`
            : ""
        }`,
      });
    } else if (ratio > 5 && metrics.costPerMonth > 0) {
      findings.push({
        id: "target-scale-over",
        severity: "tip",
        title: "Sized well past your stated target",
        message: `This design sustains ${achievable.toLocaleString()} rps -- ${Math.round(ratio)}x your stated target of ${targetScaleRps.toLocaleString()} rps, at $${metrics.costPerMonth.toLocaleString()}/mo. That headroom isn't free -- worth checking whether it's deliberate margin or just unused capacity you're paying for.`,
      });
    } else {
      findings.push({
        id: "target-scale-fit",
        severity: "tip",
        title: "Sized appropriately for your stated target",
        message: `This design sustains ${achievable.toLocaleString()} rps against a stated target of ${targetScaleRps.toLocaleString()} rps -- real headroom without obvious over-provisioning.`,
      });
    }
  }

  // Surface every anti-pattern / questionable connection the rules engine flags.
  const nodeType = (id: string) => nodes.find((n) => n.id === id)?.data.type;
  for (const edge of edges) {
    if (edge.data?.severed) continue;
    const from = nodeType(edge.source);
    const to = nodeType(edge.target);
    if (!from || !to) continue;
    const evaluation = evaluateConnection(from, to);
    if (evaluation.status === "error") {
      findings.push({
        id: `bad-connection-${edge.source}-${edge.target}`,
        severity: "critical",
        title: `${label(from)} -> ${label(to)} is an anti-pattern`,
        message: evaluation.message,
      });
    } else if (evaluation.status === "warning") {
      findings.push({
        id: `warn-connection-${edge.source}-${edge.target}`,
        severity: "warning",
        title: `${label(from)} -> ${label(to)} skips a benefit`,
        message: evaluation.message,
      });
    }
  }

  // Multiple APIs but nothing load-balancing them.
  const apis = nodesOfType(nodes, "api");
  const hasLoadBalancer = nodesOfType(nodes, "load-balancer").length > 0;
  const hasGateway = nodesOfType(nodes, "api-gateway").length > 0;
  if (apis.length >= 2 && !hasLoadBalancer && !hasGateway) {
    findings.push({
      id: "multi-api-no-lb",
      severity: "warning",
      title: "Multiple API instances, nothing distributing traffic",
      message: "You have more than one API Server but no Load Balancer or API Gateway in front of them. Without one, traffic isn't actually spread across the replicas -- add one so clients hit a single entry point.",
    });
  }

  // Single API instance carrying real traffic.
  if (apis.length === 1 && connectedIds.has(apis[0].id) && metrics.rps > 0) {
    findings.push({
      id: "single-api-spof",
      severity: "tip",
      title: "One API instance is a single point of failure",
      message: "If this server goes down, the whole system goes down with it. A second replica behind a Load Balancer removes this risk and raises your throughput ceiling.",
    });
  }

  // Single database instance as the sole source of truth.
  const databases = nodesOfType(nodes, "database");
  if (databases.length === 1 && connectedIds.has(databases[0].id)) {
    const db = databases[0];
    if (db.data.variant !== "read-replica" && apis.length >= 2) {
      findings.push({
        id: "single-db-with-scaled-api",
        severity: "warning",
        title: "Your API tier is redundant, but your database isn't",
        message: "You've scaled the API layer horizontally, but everything still funnels into one database instance. It's now the new single point of failure and the hard ceiling on your throughput -- a Read Replica raises both.",
      });
    }
  }

  // API talking directly to a database with real load, no cache in sight.
  const hasCache = nodesOfType(nodes, "cache").length > 0;
  const apiToDbDirect = edges.some(
    (e) => !e.data?.severed && nodeType(e.source) === "api" && nodeType(e.target) === "database"
  );
  if (apiToDbDirect && !hasCache && metrics.rps >= 1000) {
    findings.push({
      id: "no-cache-under-load",
      severity: "tip",
      title: "Every read is hitting the database directly",
      message: `At ${metrics.rps.toLocaleString()} RPS, a Cache in front of the database would absorb repeated reads and take real pressure off it.`,
    });
  }

  // A cache is directly shielding a database -- the exact relationship the
  // engine's cache-boost math models. Offer to actually cool it down (or, if
  // already cooled, to restore it) instead of just describing the risk.
  const cacheToDbEdges = edges.filter(
    (e) => !e.data?.severed && nodeType(e.source) === "cache" && nodeType(e.target) === "database"
  );
  for (const edge of cacheToDbEdges) {
    const cache = nodes.find((n) => n.id === edge.source);
    if (!cache || cache.data.health === "dead") continue;
    const cacheLabel = cache.data.customLabel || "This cache";
    if (cache.data.degradation >= 80) {
      findings.push({
        id: `cache-cold-active-${cache.id}`,
        severity: "warning",
        title: `${cacheLabel} is simulated cold right now`,
        message:
          "With the cache thrashing, almost everything it used to absorb is landing on the database behind it -- watch the throughput and latency numbers above react. This is the thundering-herd / cold-start failure mode: the real fix is request coalescing (single-flight) or TTL jitter on refill, not just a bigger cache.",
        action: { label: "Restore the cache", nodeId: cache.id, kind: "restore-cache" },
      });
    } else if (metrics.rps > 0) {
      findings.push({
        id: `cache-consequence-${cache.id}`,
        severity: "tip",
        title: `See what ${cacheLabel.toLowerCase()} is actually protecting`,
        message: `${cacheLabel} is currently absorbing most of the load in front of your database. Simulate it going cold (a mass eviction, a bad deploy) and watch what happens to the metrics above -- then bring it back.`,
        action: { label: "Simulate a cold cache", nodeId: cache.id, kind: "simulate-cold-cache" },
      });
    }
  }

  // Worker exists but nothing feeds it except a direct API call (already
  // caught above as a "warning" connection, but add the constructive nudge).
  const hasWorker = nodesOfType(nodes, "worker").length > 0;
  const hasQueueOrBroker = nodesOfType(nodes, "queue").length > 0 || nodesOfType(nodes, "message-broker").length > 0;
  if (hasWorker && !hasQueueOrBroker) {
    findings.push({
      id: "worker-no-buffer",
      severity: "tip",
      title: "A Worker with nothing buffering its input",
      message: "Workers are meant to process jobs handed off by a Queue or Message Broker, which absorb traffic spikes. Without one, a burst of requests can overwhelm the worker directly.",
    });
  }

  // A queue/broker feeds a worker -- the exact "decoupling" relationship
  // that's supposed to protect the rest of the system from a slow consumer.
  // Offer to actually stall the worker and let the throughput math (which
  // already treats the worker as a hard capacity ceiling) show what a queue
  // can and can't save you from: it smooths bursts, it doesn't create
  // capacity that isn't there, and if nothing ever drains it, the queue
  // that decoupled you becomes the reason nothing is moving.
  const bufferToWorkerEdges = edges.filter(
    (e) =>
      !e.data?.severed &&
      (nodeType(e.source) === "queue" || nodeType(e.source) === "message-broker") &&
      nodeType(e.target) === "worker"
  );
  for (const edge of bufferToWorkerEdges) {
    const buffer = nodes.find((n) => n.id === edge.source);
    const worker = nodes.find((n) => n.id === edge.target);
    if (!buffer || buffer.data.health === "dead" || !worker || worker.data.health === "dead") continue;
    const bufferLabel = buffer.data.customLabel || label(buffer.data.type);
    const workerLabel = worker.data.customLabel || "the worker";
    if (worker.data.degradation >= 80) {
      findings.push({
        id: `worker-backlog-active-${worker.id}`,
        severity: "warning",
        title: `${workerLabel} can't keep up right now`,
        message: `${bufferLabel} is still healthy and still accepting work -- producers aren't blocked, nothing looks broken upstream. But almost nothing is actually getting processed at the rate you need. This is the trap: a queue smooths a burst, it doesn't create capacity that isn't there. If the thing draining it never catches up, the queue you added to protect the system is now the reason nothing is moving.`,
        action: { label: "Restore the worker", nodeId: worker.id, kind: "restore-worker" },
      });
    } else if (metrics.rps > 0) {
      findings.push({
        id: `worker-backlog-consequence-${worker.id}`,
        severity: "tip",
        title: `See what happens when ${workerLabel} falls behind`,
        message: `${bufferLabel} is currently smoothing load in front of ${workerLabel}. Simulate the worker stalling (a bad deploy, a slow downstream call) and watch the throughput ceiling above -- then bring it back.`,
        action: { label: "Simulate the worker falling behind", nodeId: worker.id, kind: "simulate-worker-backlog" },
      });
    }
  }

  // CAP consistency dialed high -- point out the trade-off is deliberate,
  // not a mistake, but make sure it's understood.
  for (const db of databases) {
    if (db.data.consistency >= 80) {
      findings.push({
        id: `high-consistency-${db.id}`,
        severity: "tip",
        title: "Strong consistency has an availability cost",
        message: `${db.data.customLabel || "This database"} is dialed toward Strong consistency (${db.data.consistency}). That's the right call for data that can't be stale, but it's why your availability ceiling is lower than a design with the same components at default consistency.`,
      });
    }
  }

  // Degradation left dialed up -- likely forgotten test state.
  const degraded = alive.filter((n) => n.data.degradation > 0);
  if (degraded.length > 0) {
    findings.push({
      id: "degradation-left-on",
      severity: "tip",
      title: "Simulated degradation is still active",
      message: `${degraded.length === 1 ? "One component has" : `${degraded.length} components have`} a degradation slider dialed above 0. If that wasn't intentional, reset it in the Node Inspector -- it's quietly costing you latency and capacity.`,
    });
  }

  // Bottleneck callout using data the engine already computes.
  if (metrics.bottleneckNodeId) {
    const bottleneck = nodes.find((n) => n.id === metrics.bottleneckNodeId);
    if (bottleneck) {
      findings.push({
        id: "bottleneck",
        severity: "tip",
        title: `${bottleneck.data.customLabel || label(bottleneck.data.type)} is your current bottleneck`,
        message: "This is the node capping your overall throughput. Scaling it -- a bigger variant, a second instance, or offloading some of its work -- will raise your ceiling more than scaling anything else.",
      });
    }
  }

  // API variant likely oversized for the load it's actually carrying.
  const microserviceApisIdle = apis.filter(
    (a) => a.data.variant === "microservices" && metrics.rps > 0 && metrics.rps < a.data.maxRps * 0.15
  );
  if (microserviceApisIdle.length > 0 && apis.length <= 2) {
    findings.push({
      id: "oversized-variant",
      severity: "tip",
      title: "Microservices instance running far under capacity",
      message: "At this traffic level, a cheaper Monolith instance would likely handle the load fine. Microservices cost more per instance -- worth it once you actually need the extra capacity or independent scaling, not before.",
    });
  }

  return findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

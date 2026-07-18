// "Latency numbers every programmer should know" -- popularized by Jeff Dean
// at Google, and one of the most-cited reference tables in systems
// engineering. Public, widely-taught knowledge (not proprietary content) --
// reproduced here as a concrete, scannable reference so "why does adding a
// network hop cost latency" has real numbers behind it instead of staying
// abstract. Figures are the commonly-cited approximations, not live
// benchmarks of any particular machine.

export interface LatencyNumber {
  label: string;
  nanoseconds: number;
  note?: string;
}

export const LATENCY_NUMBERS: LatencyNumber[] = [
  { label: "L1 cache reference", nanoseconds: 1 },
  { label: "Branch mispredict", nanoseconds: 5 },
  { label: "L2 cache reference", nanoseconds: 7 },
  { label: "Mutex lock/unlock", nanoseconds: 25 },
  { label: "Main memory reference (RAM)", nanoseconds: 100 },
  { label: "Compress 1KB with a fast compressor", nanoseconds: 2000 },
  { label: "Send 1KB over a 1 Gbps network", nanoseconds: 10000 },
  { label: "Read 1MB sequentially from RAM", nanoseconds: 12000 },
  { label: "Round trip within the same datacenter", nanoseconds: 500000 },
  { label: "Read 1MB sequentially from SSD", nanoseconds: 1000000 },
  { label: "Disk seek (spinning disk)", nanoseconds: 10000000 },
  { label: "Read 1MB sequentially from a spinning disk", nanoseconds: 20000000 },
  { label: "Send a packet from California to the Netherlands and back", nanoseconds: 150000000 },
];

/** Formats a nanosecond figure as the largest sensible human-readable unit. */
export function formatLatency(ns: number): string {
  if (ns < 1000) return `${ns} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} µs`;
  if (ns < 1_000_000_000)
    return `${(ns / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })} ms`;
  return `${(ns / 1_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} s`;
}

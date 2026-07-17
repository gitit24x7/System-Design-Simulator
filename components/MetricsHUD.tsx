"use client";

import { Activity, DollarSign, Gauge, ShieldCheck } from "lucide-react";
import { SystemMetrics } from "@/lib/engine";

function Gauge_({
  icon: Icon,
  label,
  value,
  danger,
  title,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  danger?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      className="flex flex-1 flex-col items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1"
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500">
        <Icon size={10} />
        {label}
      </div>
      <span className={`text-sm font-semibold ${danger ? "text-red-400" : "text-zinc-100"}`}>
        {value}
      </span>
    </div>
  );
}

export default function MetricsHUD({ metrics }: { metrics: SystemMetrics }) {
  const b = metrics.availabilityBreakdown;
  const availabilityTitle =
    `Baseline: ${b.baselinePct}%\n` +
    `- ${b.deadNodeCount} dead node${b.deadNodeCount === 1 ? "" : "s"}: -${b.deadNodePenaltyPct}pts\n` +
    `- CAP consistency penalty: -${b.capPenaltyPct}pts\n` +
    `= ${metrics.availabilityPct.toFixed(2)}%`;

  return (
    <div className="grid grid-cols-2 gap-1.5 border-b border-zinc-800 bg-zinc-950 p-1.5 sm:flex">
      <Gauge_ icon={Gauge} label="Throughput" value={`${metrics.rps.toLocaleString()} rps`} />
      <Gauge_ icon={Activity} label="Latency" value={`${metrics.latencyMs} ms`} />
      <Gauge_
        icon={ShieldCheck}
        label="Availability"
        value={`${metrics.availabilityPct.toFixed(2)}%`}
        danger={metrics.availabilityPct < 99}
        title={availabilityTitle}
      />
      <Gauge_ icon={DollarSign} label="Cost" value={`$${metrics.costPerMonth}/mo`} />
    </div>
  );
}

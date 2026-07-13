"use client";

import Link from "next/link";

const NODE_POSITIONS = [
  { x: 12, y: 55, label: "CLIENT" },
  { x: 34, y: 35, label: "LB" },
  { x: 34, y: 80, label: "CACHE" },
  { x: 60, y: 55, label: "API" },
  { x: 84, y: 55, label: "DB" },
];

const NODE_LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
];

function CanvasMockup() {
  return (
    <div className="relative h-[280px] overflow-hidden bg-[#0a0a0a] sm:h-[400px]">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {NODE_LINKS.map(([a, b], i) => (
          <line
            key={i}
            x1={`${NODE_POSITIONS[a].x}%`}
            y1={`${NODE_POSITIONS[a].y}%`}
            x2={`${NODE_POSITIONS[b].x}%`}
            y2={`${NODE_POSITIONS[b].y}%`}
            stroke="#34a853"
            strokeWidth={2}
            opacity={0.6}
          />
        ))}
      </svg>
      {NODE_POSITIONS.map((n) => (
        <div
          key={n.label}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border-[1.5px] border-[#4285f4] bg-[#111] px-1.5 py-1 text-[10px] font-bold text-[#eaf2ff] sm:px-3 sm:py-2 sm:text-[11px]"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          {n.label}
        </div>
      ))}
      <div className="sds-scan absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4285f4]/85 to-transparent" />
      <div className="absolute left-3 top-3 border-[1.5px] border-[#34A853] bg-white/90 px-2 py-1.5 text-[10px] font-bold text-[#34A853] sm:left-6 sm:top-5 sm:px-3 sm:text-[11px]">
        THROUGHPUT: 12,400 RPS
      </div>
      <div className="absolute right-3 top-3 border-[1.5px] border-[#EA4335] bg-white/90 px-2 py-1.5 text-[10px] font-bold text-[#EA4335] sm:right-6 sm:top-5 sm:px-3 sm:text-[11px]">
        LATENCY: 38 MS
      </div>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section
      className="sds-gradient-move flex flex-col items-center gap-5 px-6 py-16 text-center sm:px-[60px] sm:py-[90px]"
      style={{
        backgroundImage:
          "linear-gradient(120deg, #ffffff 0%, #d7f0ff 25%, #ffffff 50%, #b3e2ff 75%, #ffffff 100%)",
      }}
    >
      <p className="text-xs font-bold tracking-[0.1em] text-[#4285F4]">
        // SYSTEM DESIGN, HANDS ON
      </p>
      <h1 className="max-w-[840px] text-[34px] font-bold uppercase leading-[1.08] text-[#0a0a0a] sm:text-[42px] lg:text-[58px]">
        DESIGN REAL SYSTEMS. BREAK THEM ON PURPOSE.
      </h1>
      <p className="max-w-[560px] text-[15.5px] leading-[1.65] text-[#3a3a3a]">
        Drag components onto a canvas, wire them together, then run chaos tests to see what
        survives.
      </p>
      <div className="mt-2 flex border-[2.5px] border-[#0a0a0a]">
        <Link
          href="/app"
          className="sds-btn-shine cursor-pointer whitespace-nowrap px-6 py-3.5 text-sm font-bold text-white transition-transform hover:scale-105 hover:shadow-[0_0_22px_rgba(66,133,244,0.5)]"
        >
          START_FREE
        </Link>
        <Link
          href="/app"
          className="whitespace-nowrap px-6 py-3.5 text-sm font-bold text-[#0a0a0a] transition-transform hover:scale-105"
        >
          VIEW_A_LEVEL →
        </Link>
      </div>
      <div className="mt-6 w-full max-w-[920px] border-[2.5px] border-[#0a0a0a] bg-white shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
        <div className="flex h-8 items-center gap-2 bg-[#0a0a0a] px-3.5">
          <div className="h-2 w-2 bg-white" />
          <span className="text-[11px] tracking-[0.05em] text-white">CANVAS.SIM</span>
        </div>
        <CanvasMockup />
      </div>
    </section>
  );
}

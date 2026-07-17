"use client";

import Link from "next/link";

function CanvasMockup() {
  return (
    <div className="relative overflow-hidden bg-[#0a0a0a]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-canvas.png"
        alt="A real design built in System Design Simulator: Client, Load Balancer, an API server flagged as the current bottleneck, a Cache, and a Database, all wired together with live throughput/latency/cost stats."
        className="block h-auto w-full"
      />
      <div className="sds-scan absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4285f4]/85 to-transparent" />
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
      <a
        href="https://peerlist.io/adityaojha/project/systemdesignsimulator"
        target="_blank"
        rel="noreferrer"
        className="mt-1"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://peerlist.io/api/v1/projects/embed/PRJHMQ6PNRMBRP7EGID9EGEAMDDG7O?showUpvote=true&theme=dark"
          alt="System-design-simulator"
          className="h-[54px] w-auto sm:h-[72px]"
        />
      </a>
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

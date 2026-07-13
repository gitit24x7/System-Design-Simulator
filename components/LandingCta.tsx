import Link from "next/link";

export default function LandingCta() {
  return (
    <section
      className="sds-gradient-move relative flex flex-col items-center gap-5 overflow-hidden border-t-[2.5px] border-[#0a0a0a] px-6 py-16 text-center sm:px-[60px] sm:py-20"
      style={{
        backgroundImage:
          "linear-gradient(120deg,#0a0a0a,#0a1220,#0a0a0a,#1a0d05,#0a0a0a)",
        backgroundSize: "400% 400%",
      }}
    >
      <div
        className="sds-cta-glow pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm"
        style={{
          backgroundImage:
            "conic-gradient(from 0deg, rgba(66,133,244,0.32), rgba(234,67,53,0.32), rgba(251,188,5,0.32), rgba(52,168,83,0.32), rgba(66,133,244,0.32))",
        }}
      />
      <h2 className="relative z-10 max-w-[620px] text-2xl font-bold uppercase text-white sm:text-[32px]">
        Ready to design something that might break?
      </h2>
      <Link
        href="/app"
        className="sds-pulse-glow relative z-10 cursor-pointer px-8 py-[15px] text-[14.5px] font-bold text-white transition-transform hover:scale-[1.06]"
      >
        START_FREE
      </Link>
      <p className="relative z-10 text-xs text-[#9a9a9a]">
        NO CREDIT CARD. FREE LEVELS FOREVER.
      </p>
    </section>
  );
}

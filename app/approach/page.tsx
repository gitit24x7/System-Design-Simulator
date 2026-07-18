import { JetBrains_Mono } from "next/font/google";
import "../landing.css";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { APPROACH_STEPS } from "@/lib/approach";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata = {
  title: "How to Approach Any System Design Problem — System Design Simulator",
  description:
    "A repeatable five-step framework for tackling any system design problem, in an interview or otherwise.",
};

export default function ApproachPage() {
  return (
    <div className={`${jetbrainsMono.className} w-full overflow-x-hidden bg-white`}>
      <LandingNav />
      <main className="mx-auto flex max-w-[860px] flex-col gap-10 px-6 py-16 sm:px-[60px] sm:py-[76px]">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-[0.1em] text-[#4285F4]">// THE FRAMEWORK</p>
          <h1 className="text-[32px] font-bold uppercase leading-[1.1] text-[#0a0a0a] sm:text-[42px]">
            How to approach any system design problem.
          </h1>
          <p className="max-w-[600px] text-[14.5px] leading-[1.75] text-[#3a3a3a]">
            Every guided level on this platform is built around the same five-step sequence, but the
            objectives never say so out loud. Here it is, named explicitly, so the habit carries over to
            a real interview or a real problem this app hasn&apos;t modeled.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {APPROACH_STEPS.map((s) => (
            <section key={s.step} className="flex gap-4 border-b-2 border-[#0a0a0a] pb-8 last:border-b-0">
              <div className="shrink-0 text-[32px] font-bold text-[#4285F4]">
                {String(s.step).padStart(2, "0")}
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-[18px] font-bold uppercase text-[#0a0a0a]">{s.title}</h2>
                <p className="text-[13.5px] font-medium italic text-[#3a3a3a]">{s.summary}</p>
                <ul className="mt-1 list-disc space-y-1.5 pl-4">
                  {s.details.map((d) => (
                    <li key={d} className="text-[13.5px] leading-[1.65] text-[#3a3a3a]">
                      {d}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 border-l-2 border-[#34A853] pl-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#34A853]">
                    On this platform
                  </div>
                  <p className="mt-1 text-[12.5px] leading-[1.6] text-[#3a3a3a]">{s.inApp}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <p className="text-[13px] leading-[1.75] text-[#3a3a3a]">
          None of this is unique to this platform -- it&apos;s the same sequence taught across most system
          design courses and interview prep material. Naming it is the whole point: once it&apos;s a
          checklist instead of a vague sense of what to do next, it applies to any problem you&apos;re
          handed, not just the ones already built here.
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}

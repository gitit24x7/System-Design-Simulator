import { JetBrains_Mono } from "next/font/google";
import "../landing.css";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { CONCEPTS, GLOSSARY_CATEGORY_ORDER } from "@/lib/concepts";
import { COMPARISON_TABLES } from "@/lib/comparisons";
import { formatLatency, LATENCY_NUMBERS } from "@/lib/latencyNumbers";

const MAX_LOG_NS = Math.log10(LATENCY_NUMBERS[LATENCY_NUMBERS.length - 1].nanoseconds);

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata = {
  title: "Glossary — System Design Simulator",
  description: "Every system design concept the platform teaches, defined in depth with real-world context.",
};

export default function GlossaryPage() {
  const entries = Object.entries(CONCEPTS);

  return (
    <div className={`${jetbrainsMono.className} w-full overflow-x-hidden bg-white`}>
      <LandingNav />
      <main className="mx-auto flex max-w-[860px] flex-col gap-10 px-6 py-16 sm:px-[60px] sm:py-[76px]">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-[0.1em] text-[#4285F4]">// GLOSSARY</p>
          <h1 className="text-[32px] font-bold uppercase leading-[1.1] text-[#0a0a0a] sm:text-[42px]">
            Every concept, defined properly.
          </h1>
          <p className="max-w-[560px] text-[14.5px] leading-[1.75] text-[#3a3a3a]">
            {entries.length} terms, organized the way the platform teaches them: a simple definition first,
            a deeper explanation second, grounded in a real system, plus the misconception that trips
            people up in interviews.
          </p>
        </div>

        {GLOSSARY_CATEGORY_ORDER.map((category) => {
          const inCategory = entries.filter(([, c]) => c.category === category);
          if (inCategory.length === 0) return null;
          return (
            <section key={category} className="flex flex-col gap-6">
              <h2 className="border-b-2 border-[#0a0a0a] pb-2 text-lg font-bold uppercase text-[#0a0a0a]">
                {category}
              </h2>
              <div className="flex flex-col gap-8">
                {inCategory.map(([id, c]) => (
                  <div key={id} className="flex flex-col gap-2">
                    <h3 className="text-[16px] font-bold text-[#0a0a0a]">{c.label}</h3>
                    <p className="text-[13.5px] font-medium italic text-[#4285F4]">{c.shortDefinition}</p>
                    <p className="text-[13.5px] leading-[1.75] text-[#3a3a3a]">{c.definition}</p>
                    <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="border-l-2 border-[#34A853] pl-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-[#34A853]">
                          In practice
                        </div>
                        <p className="mt-1 text-[12.5px] leading-[1.6] text-[#3a3a3a]">{c.realWorld}</p>
                      </div>
                      <div className="border-l-2 border-[#FBBC05] pl-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-[#b58900]">
                          Common gotcha
                        </div>
                        <p className="mt-1 text-[12.5px] leading-[1.6] text-[#3a3a3a]">{c.gotcha}</p>
                      </div>
                    </div>
                    {c.followUps.length > 0 && (
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {c.followUps.map((q) => (
                          <li key={q} className="text-[12.5px] leading-[1.6] text-[#3a3a3a]">
                            {q}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="flex flex-col gap-6">
          <h2 className="border-b-2 border-[#0a0a0a] pb-2 text-lg font-bold uppercase text-[#0a0a0a]">
            Latency Numbers Every Programmer Should Know
          </h2>
          <p className="max-w-[600px] text-[13.5px] leading-[1.75] text-[#3a3a3a]">
            Popularized by Jeff Dean at Google, and one of the most-cited reference tables in systems
            engineering -- the concrete numbers behind &quot;why does adding a network hop cost latency.&quot;
          </p>
          <div className="flex flex-col gap-1.5">
            {LATENCY_NUMBERS.map((l) => {
              const pct = (Math.log10(l.nanoseconds) / MAX_LOG_NS) * 100;
              return (
                <div key={l.label} className="relative flex items-center justify-between overflow-hidden border border-[#0a0a0a]/15 px-3 py-1.5">
                  <div className="absolute inset-y-0 left-0 bg-[#d7f0ff]" style={{ width: `${Math.max(pct, 2)}%` }} />
                  <span className="relative z-10 text-[12.5px] text-[#0a0a0a]">{l.label}</span>
                  <span className="relative z-10 text-[12.5px] font-bold text-[#0a0a0a]">
                    {formatLatency(l.nanoseconds)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {COMPARISON_TABLES.map((t) => (
          <section key={t.id} className="flex flex-col gap-4">
            <h2 className="border-b-2 border-[#0a0a0a] pb-2 text-lg font-bold uppercase text-[#0a0a0a]">
              {t.title}
            </h2>
            <p className="max-w-[600px] text-[13.5px] leading-[1.75] text-[#3a3a3a]">{t.blurb}</p>
            <div className="overflow-x-auto border-2 border-[#0a0a0a]">
              <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#0a0a0a]">
                    <th className="px-3 py-2 text-left text-white"></th>
                    {t.columns.map((c) => (
                      <th key={c} className="px-3 py-2 text-left font-bold text-white">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r, i) => (
                    <tr key={r.feature} className={i % 2 === 1 ? "bg-[#f2f7ff]" : ""}>
                      <td className="border-t border-[#0a0a0a]/15 px-3 py-2 font-bold text-[#0a0a0a]">
                        {r.feature}
                      </td>
                      {r.values.map((v, j) => (
                        <td key={j} className="border-t border-[#0a0a0a]/15 px-3 py-2 text-[#3a3a3a]">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
      <LandingFooter />
    </div>
  );
}

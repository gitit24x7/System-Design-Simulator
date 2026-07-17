import { JetBrains_Mono } from "next/font/google";
import "../landing.css";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { CONCEPTS, GLOSSARY_CATEGORY_ORDER } from "@/lib/concepts";

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
      </main>
      <LandingFooter />
    </div>
  );
}

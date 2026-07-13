import { JetBrains_Mono } from "next/font/google";
import "../landing.css";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata = {
  title: "About — System Design Simulator",
  description: "Why System Design Simulator exists and who it's built for.",
};

export default function AboutPage() {
  return (
    <div className={`${jetbrainsMono.className} w-full overflow-x-hidden bg-white`}>
      <LandingNav />
      <main className="mx-auto flex max-w-[760px] flex-col gap-8 px-6 py-16 sm:px-[60px] sm:py-[76px]">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-[0.1em] text-[#4285F4]">// ABOUT</p>
          <h1 className="text-[32px] font-bold uppercase leading-[1.1] text-[#0a0a0a] sm:text-[42px]">
            System design is hard to learn from a diagram.
          </h1>
        </div>

        <div className="flex flex-col gap-5 text-[14.5px] leading-[1.75] text-[#3a3a3a]">
          <p>
            Most system design material is static: a whiteboard photo, a slide deck, a wall of
            text explaining why load balancers matter. You read it, nod along, and then freeze
            the first time an interviewer asks you to actually draw one.
          </p>
          <p>
            System Design Simulator is a canvas instead of a slide. You drag real components —
            clients, load balancers, caches, databases, queues — onto a board and wire them
            together. Every connection carries real throughput, latency, and cost. Nothing is
            hypothetical: if you forget a load balancer, your single API server becomes a
            single point of failure, and Chaos Monkey will find it.
          </p>
          <p>
            The goal isn&apos;t to memorize a checklist of components. It&apos;s to build the
            instinct for how a system behaves under load, what breaks first, and why the
            trade-offs (SQL vs. NoSQL, strong vs. eventual consistency, monolith vs.
            microservices) actually matter in a specific design — not in the abstract.
          </p>
          <p>
            Guided levels walk through a progression, from a plain URL shortener to a
            distributed, highly-available system that has to survive any single component
            failing. Sandbox mode drops the guardrails so you can design freely, simulate
            traffic, and stress-test whatever you build.
          </p>
          <p>
            It&apos;s built for the same audience it was built by: people preparing for system
            design interviews, students who want to see the theory move, and engineers who
            learn better by breaking things on purpose than by reading about them.
          </p>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

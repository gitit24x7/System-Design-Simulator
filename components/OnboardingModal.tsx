"use client";

import { useEffect, useState } from "react";
import { Map, Cable, Sparkles, Skull, X } from "lucide-react";

const SEEN_KEY = "sysforge-onboarding-seen-v2";

const STEPS = [
  {
    icon: Map,
    title: "60 levels, 20 real-world scenarios",
    body: "Open the Level Map to pick a project -- URL shorteners, ride-matching, fintech risk platforms, and more -- each with Easy, Medium, and Hard tiers that raise the bar as you go.",
  },
  {
    icon: Cable,
    title: "Build it, and understand why",
    body: "Click a component to drop it, drag from any edge to connect two nodes, and every requirement comes with a short explanation of the real concept behind it -- not just a checklist.",
  },
  {
    icon: Sparkles,
    title: "Get a second opinion",
    body: "Open Design Critique any time -- in a level or in Sandbox -- for rule-based feedback on single points of failure, missing caches, anti-pattern connections, and more.",
  },
  {
    icon: Skull,
    title: "Break it on purpose",
    body: "Use Chaos Monkey to kill a node or sever a connection, then watch your metrics react in real time. Nothing you build is safe until it survives that.",
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-h-[90vh] w-[26rem] max-w-[92vw] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Welcome to SysForge</h2>
          <button onClick={dismiss} className="text-zinc-500 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {STEPS.map((step) => (
            <li key={step.title} className="flex gap-3">
              <step.icon size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-zinc-200">{step.title}</p>
                <p className="text-xs text-zinc-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <button
          onClick={dismiss}
          className="mt-5 w-full rounded-md border border-emerald-700 bg-emerald-950/50 py-1.5 text-sm text-emerald-300 hover:bg-emerald-900/50"
        >
          Got it, let's build
        </button>
      </div>
    </div>
  );
}

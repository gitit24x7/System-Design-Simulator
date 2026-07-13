"use client";

import { useEffect, useState } from "react";
import { MousePointerClick, Cable, SlidersHorizontal, Skull, X } from "lucide-react";

const SEEN_KEY = "sysforge-onboarding-seen";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Add components",
    body: "Click a component in the sidebar to drop it on the canvas, or drag it to a specific spot.",
  },
  {
    icon: Cable,
    title: "Connect anything, anywhere",
    body: "Drag from any edge of a node to any other node -- connections route themselves cleanly no matter which side you grab.",
  },
  {
    icon: SlidersHorizontal,
    title: "Configure and learn trade-offs",
    body: "Click a node to switch its configuration (e.g. Monolith vs Microservices) and see the real trade-offs of each choice.",
  },
  {
    icon: Skull,
    title: "Break it on purpose",
    body: "Use Chaos Monkey to kill a node or sever a connection, then watch your metrics react in real time.",
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
      <div className="w-[26rem] rounded-lg border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
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

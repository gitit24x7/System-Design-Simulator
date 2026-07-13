"use client";

import { useEffect, useState } from "react";
import { useSysForgeStore } from "@/lib/store";

const VISIBLE_MS = 3200;

export default function ChaosToast() {
  const chaosEvent = useSysForgeStore((s) => s.chaosEvent);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!chaosEvent) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [chaosEvent?.key]);

  if (!chaosEvent) return null;

  return (
    <div
      className={`no-export pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-md border border-zinc-700 bg-zinc-950/95 px-3 py-1.5 text-xs text-zinc-200 shadow-lg transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {chaosEvent.message}
    </div>
  );
}

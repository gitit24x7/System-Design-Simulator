"use client";

import { LEVELS } from "@/lib/campaign";
import { useSysForgeStore } from "@/lib/store";

export default function LevelSelector() {
  const currentLevelId = useSysForgeStore((s) => s.currentLevelId);
  const setCurrentLevelId = useSysForgeStore((s) => s.setCurrentLevelId);

  return (
    <select
      value={currentLevelId}
      onChange={(e) => setCurrentLevelId(e.target.value)}
      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 focus:outline-none"
    >
      {LEVELS.map((level) => (
        <option key={level.id} value={level.id}>
          {level.title}
        </option>
      ))}
    </select>
  );
}

"use client";

import { useState } from "react";
import { Map } from "lucide-react";
import { getLevel, PROJECTS } from "@/lib/campaign";
import { useSysForgeStore } from "@/lib/store";
import LevelMapModal from "./LevelMapModal";

const TOTAL_LEVELS = PROJECTS.length * 3;

export default function LevelSelector() {
  const currentLevelId = useSysForgeStore((s) => s.currentLevelId);
  const completedLevelIds = useSysForgeStore((s) => s.completedLevelIds);
  const [open, setOpen] = useState(false);
  const level = getLevel(currentLevelId);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Browse all projects and levels"
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
      >
        <Map size={14} />
        <span className="max-w-[160px] truncate">
          {level ? `${level.projectTitle} (${level.difficulty})` : "Pick a level"}
        </span>
        <span className="text-zinc-500">
          {completedLevelIds.length}/{TOTAL_LEVELS}
        </span>
      </button>
      {open && <LevelMapModal onClose={() => setOpen(false)} />}
    </>
  );
}

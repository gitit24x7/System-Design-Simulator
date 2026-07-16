"use client";

import { Check, X } from "lucide-react";
import { Difficulty, PROJECTS } from "@/lib/campaign";
import { getLevelTags, CONCEPTS } from "@/lib/concepts";
import { useSysForgeStore } from "@/lib/store";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_PILL: Record<Difficulty, string> = {
  easy: "border-emerald-700 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60",
  medium: "border-amber-700 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60",
  hard: "border-red-700 bg-red-950/40 text-red-300 hover:bg-red-900/60",
};

const TOTAL_LEVELS = PROJECTS.length * 3;

export default function LevelMapModal({ onClose }: { onClose: () => void }) {
  const currentLevelId = useSysForgeStore((s) => s.currentLevelId);
  const setCurrentLevelId = useSysForgeStore((s) => s.setCurrentLevelId);
  const completedLevelIds = useSysForgeStore((s) => s.completedLevelIds);

  const pick = (id: string) => {
    setCurrentLevelId(id);
    onClose();
  };

  return (
    <div className="no-export fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg border border-zinc-700 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Level Map</h2>
            <p className="text-[11px] text-zinc-500">
              {completedLevelIds.length} / {TOTAL_LEVELS} levels complete
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PROJECTS.map((project) => {
              const projectTags = new Set<string>();
              project.levels.forEach((l) => getLevelTags(l.objectives.map((o) => o.id)).forEach((t) => projectTags.add(t)));

              return (
                <div key={project.id} className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">{project.title}</h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{project.summary}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {project.levels.map((level) => {
                      const id = `${project.id}-${level.difficulty}`;
                      const done = completedLevelIds.includes(id);
                      const active = id === currentLevelId;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => pick(id)}
                          title={level.title}
                          className={`flex flex-1 items-center justify-center gap-1 rounded border px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${DIFFICULTY_PILL[level.difficulty]} ${
                            active ? "ring-1 ring-zinc-400" : ""
                          }`}
                        >
                          {done && <Check size={10} />}
                          {DIFFICULTY_LABELS[level.difficulty]}
                        </button>
                      );
                    })}
                  </div>
                  {projectTags.size > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Array.from(projectTags).map((tag) => (
                        <span key={tag} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">
                          {CONCEPTS[tag]?.label ?? tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

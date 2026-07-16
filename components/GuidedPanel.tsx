"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, X, Trophy, ListChecks, Gauge, BookOpen } from "lucide-react";
import { Difficulty, Level, LEVELS, getNextLevelId, validateLevel } from "@/lib/campaign";
import { GraphEdge, GraphNode, SystemMetrics } from "@/lib/engine";
import { useSysForgeStore } from "@/lib/store";
import DebriefModal from "./DebriefModal";

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy: "border-emerald-700 bg-emerald-950/50 text-emerald-300",
  medium: "border-amber-700 bg-amber-950/50 text-amber-300",
  hard: "border-red-700 bg-red-950/50 text-red-300",
};

export default function GuidedPanel({
  level,
  nodes,
  edges,
  metrics,
}: {
  level: Level;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: SystemMetrics;
}) {
  const { progress, allComplete } = validateLevel(level, nodes, edges, metrics);
  const mobileGuidedPanelOpen = useSysForgeStore((s) => s.mobileGuidedPanelOpen);
  const setMobileGuidedPanelOpen = useSysForgeStore((s) => s.setMobileGuidedPanelOpen);
  const completedLevelIds = useSysForgeStore((s) => s.completedLevelIds);
  const markLevelComplete = useSysForgeStore((s) => s.markLevelComplete);
  const setCurrentLevelId = useSysForgeStore((s) => s.setCurrentLevelId);
  const [showDebrief, setShowDebrief] = useState(false);

  useEffect(() => {
    setShowDebrief(false);
  }, [level.id]);

  useEffect(() => {
    if (allComplete && !completedLevelIds.includes(level.id)) {
      markLevelComplete(level.id);
      setShowDebrief(true);
    }
  }, [allComplete, level.id, completedLevelIds, markLevelComplete]);

  const nextLevelId = getNextLevelId(level.id);
  const nextLevel = LEVELS.find((l) => l.id === nextLevelId);
  const goToNextLevel = () => {
    setShowDebrief(false);
    setCurrentLevelId(nextLevelId);
    setMobileGuidedPanelOpen(false);
  };

  return (
    <>
      {mobileGuidedPanelOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileGuidedPanelOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-80 max-w-[85vw] shrink-0 flex-col gap-3 overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4 transition-transform duration-200 lg:static lg:z-auto lg:w-72 lg:max-w-none lg:translate-x-0 ${
          mobileGuidedPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100">{level.projectTitle}</h2>
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${DIFFICULTY_BADGE[level.difficulty]}`}
              >
                {level.difficulty}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-zinc-400">{level.title}</p>
            <p className="mt-1 text-xs text-zinc-500">{level.scenario}</p>
            <p className="mt-1 text-[11px] text-zinc-600">
              {completedLevelIds.length} / {LEVELS.length} levels complete
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileGuidedPanelOpen(false)}
            className="shrink-0 text-zinc-500 hover:text-zinc-300 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <ListChecks size={12} />
          Functional Requirements
        </div>
        <ul className="mb-3 list-disc space-y-1 pl-4 text-xs text-zinc-400">
          {level.requirements.functional.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <Gauge size={12} />
          Non-Functional Requirements
        </div>
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
          {level.requirements.nonFunctional.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Your Progress
        </div>
        <ul className="flex flex-col gap-3">
          {progress.map((p) => (
            <li key={p.objectiveId} className="flex items-start gap-2 text-sm">
              {p.completed ? (
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <X size={16} className="mt-0.5 shrink-0 text-zinc-600" />
              )}
              <div>
                <span className={p.completed ? "text-zinc-300 line-through" : "text-zinc-400"}>
                  {p.description}
                </span>
                <p className="mt-0.5 text-[11px] leading-snug text-zinc-600">{p.why}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {allComplete && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-700 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-300">
            <span className="flex items-center gap-2">
              <Trophy size={16} />
              Level complete!
            </span>
            <button
              type="button"
              onClick={() => setShowDebrief(true)}
              title="View debrief"
              className="text-emerald-400 hover:text-emerald-200"
            >
              <BookOpen size={15} />
            </button>
          </div>
          {nextLevel && (
            <button
              type="button"
              onClick={goToNextLevel}
              className="flex items-center justify-center gap-1.5 rounded-md border border-emerald-700 bg-emerald-900/40 px-3 py-2 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-900/70"
            >
              Next: {nextLevel.projectTitle} ({nextLevel.difficulty})
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
      </aside>
      {showDebrief && (
        <DebriefModal
          level={level}
          onClose={() => setShowDebrief(false)}
          onNext={goToNextLevel}
          nextLevelLabel={nextLevel ? `${nextLevel.projectTitle} (${nextLevel.difficulty})` : null}
        />
      )}
    </>
  );
}

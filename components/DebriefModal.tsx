"use client";

import { ArrowRight, HelpCircle, Trophy, X } from "lucide-react";
import { getLevelTags, CONCEPTS } from "@/lib/concepts";
import { Level } from "@/lib/campaign";

export default function DebriefModal({
  level,
  onClose,
  onNext,
  nextLevelLabel,
}: {
  level: Level;
  onClose: () => void;
  onNext: () => void;
  nextLevelLabel: string | null;
}) {
  const tags = getLevelTags(level.objectives.map((o) => o.id));
  const concepts = tags.map((t) => CONCEPTS[t]).filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="no-export fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-emerald-700 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Level Complete</h2>
              <p className="text-[11px] text-zinc-500">
                {level.projectTitle} -- {level.title}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {concepts.length === 0 ? (
            <p className="text-xs text-zinc-500">Nice work getting this design working end to end.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {concepts.map((concept) => (
                <div key={concept.label}>
                  <h3 className="text-xs font-semibold text-emerald-300">{concept.label}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">{concept.realWorld}</p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {concept.followUps.map((q) => (
                      <li key={q} className="flex items-start gap-1.5 text-[11px] text-zinc-500">
                        <HelpCircle size={12} className="mt-0.5 shrink-0 text-zinc-600" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-zinc-800 p-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Stay Here
          </button>
          {nextLevelLabel && (
            <button
              type="button"
              onClick={onNext}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-700 bg-emerald-900/40 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-900/70"
            >
              Next: {nextLevelLabel}
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

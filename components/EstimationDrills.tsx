"use client";

import { useMemo, useState } from "react";
import { Calculator, Check, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import { checkEstimationAnswer, ESTIMATION_DRILLS } from "@/lib/estimation";
import { useSysForgeStore } from "@/lib/store";

export default function EstimationDrills() {
  const open = useSysForgeStore((s) => s.estimationPanelOpen);
  const setOpen = useSysForgeStore((s) => s.setEstimationPanelOpen);
  const [index, setIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [revealed, setRevealed] = useState(false);

  const drill = ESTIMATION_DRILLS[index];

  const formattedAnswer = useMemo(
    () => `${drill.answer.toLocaleString()} ${drill.unit}`,
    [drill]
  );

  if (!open) return null;

  const goTo = (next: number) => {
    setIndex((next + ESTIMATION_DRILLS.length) % ESTIMATION_DRILLS.length);
    setInputValue("");
    setResult(null);
    setRevealed(false);
  };

  const onCheck = () => {
    const parsed = Number(inputValue.replace(/,/g, ""));
    setResult(checkEstimationAnswer(drill, parsed) ? "correct" : "incorrect");
  };

  return (
    <div
      className="no-export fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-zinc-700 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Estimation Drills</h2>
            <span className="text-[10px] text-zinc-600">
              {index + 1} / {ESTIMATION_DRILLS.length}
            </span>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
              {drill.category}
            </span>
          </div>

          <p className="text-[13px] leading-relaxed text-zinc-200">{drill.prompt}</p>
          <p className="mt-2 text-[13px] font-semibold text-sky-400">{drill.question}</p>

          <ul className="mt-3 flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2">
            {drill.givens.map((g) => (
              <li key={g} className="text-[11px] text-zinc-500">
                • {g}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setResult(null);
              }}
              placeholder={`Your estimate, in ${drill.unit}`}
              className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={onCheck}
              disabled={!inputValue.trim()}
              className="shrink-0 rounded-md border border-emerald-700 bg-emerald-950/50 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check
            </button>
          </div>

          {result && (
            <div
              className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                result === "correct"
                  ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
                  : "border-amber-700 bg-amber-950/40 text-amber-300"
              }`}
            >
              {result === "correct" ? <Check size={14} /> : <Lightbulb size={14} />}
              {result === "correct"
                ? "Right order of magnitude -- that's the actual bar here, not an exact match."
                : `Off by more than the working tolerance. The target answer is ${formattedAnswer}.`}
            </div>
          )}

          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="mt-3 text-[11px] font-medium text-violet-400 hover:text-violet-300"
          >
            {revealed ? "Hide worked solution" : "Show worked solution"}
          </button>

          {revealed && (
            <div className="mt-2 flex flex-col gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
              <ol className="flex flex-col gap-1">
                {drill.steps.map((s, i) => (
                  <li key={i} className="text-[11px] leading-relaxed text-zinc-400">
                    <span className="text-zinc-600">{i + 1}.</span> {s}
                  </li>
                ))}
              </ol>
              <p className="text-[11px] font-semibold text-zinc-300">Answer: {formattedAnswer}</p>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Rule of thumb</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{drill.tip}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <p className="text-[11px] text-zinc-600">Order-of-magnitude scoring, on purpose</p>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

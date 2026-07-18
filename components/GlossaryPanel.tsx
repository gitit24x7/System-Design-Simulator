"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { CONCEPTS, GLOSSARY_CATEGORY_ORDER } from "@/lib/concepts";
import { COMPARISON_TABLES } from "@/lib/comparisons";
import { formatLatency, LATENCY_NUMBERS } from "@/lib/latencyNumbers";
import { useSysForgeStore } from "@/lib/store";

const MAX_LOG_NS = Math.log10(LATENCY_NUMBERS[LATENCY_NUMBERS.length - 1].nanoseconds);

export default function GlossaryPanel() {
  const open = useSysForgeStore((s) => s.glossaryPanelOpen);
  const setOpen = useSysForgeStore((s) => s.setGlossaryPanelOpen);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const entries = useMemo(() => Object.entries(CONCEPTS), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      ([, c]) =>
        c.label.toLowerCase().includes(q) ||
        c.shortDefinition.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q)
    );
  }, [entries, query]);

  if (!open) return null;

  return (
    <div className="no-export fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-zinc-700 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <h2 className="shrink-0 text-sm font-semibold text-zinc-100">Glossary</h2>
          <div className="relative flex-1">
            <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search terms..."
              className="w-full rounded border border-zinc-700 bg-zinc-900 py-1 pl-7 pr-2 text-xs text-zinc-200 focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <button type="button" onClick={() => setOpen(false)} className="shrink-0 text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-500">No terms match &quot;{query}&quot;.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {GLOSSARY_CATEGORY_ORDER.map((category) => {
                const inCategory = filtered.filter(([, c]) => c.category === category);
                if (inCategory.length === 0) return null;
                return (
                  <div key={category}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                      {category}
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {inCategory.map(([id, c]) => {
                        const expanded = expandedId === id;
                        return (
                          <li key={id} className="rounded-md border border-zinc-800 bg-zinc-900/50">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : id)}
                              className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left"
                            >
                              <div>
                                <div className="text-xs font-semibold text-zinc-200">{c.label}</div>
                                <p className="mt-0.5 text-[11px] text-zinc-500">{c.shortDefinition}</p>
                              </div>
                              <ChevronDown
                                size={14}
                                className={`mt-0.5 shrink-0 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
                              />
                            </button>
                            {expanded && (
                              <div className="flex flex-col gap-2 border-t border-zinc-800 px-3 py-2.5">
                                <p className="text-[11px] leading-relaxed text-zinc-400">{c.definition}</p>
                                <div>
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                                    In practice
                                  </div>
                                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{c.realWorld}</p>
                                </div>
                                <div>
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                                    Common gotcha
                                  </div>
                                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{c.gotcha}</p>
                                </div>
                                {c.followUps.length > 0 && (
                                  <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-400">
                                      Think about it
                                    </div>
                                    <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
                                      {c.followUps.map((q) => (
                                        <li key={q} className="text-[11px] leading-relaxed text-zinc-400">
                                          {q}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {!query.trim() && (
            <div className="mt-8 flex flex-col gap-6 border-t border-zinc-800 pt-6">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                  Latency Numbers Every Programmer Should Know
                </div>
                <p className="mb-2 text-[11px] text-zinc-500">
                  Popularized by Jeff Dean at Google -- the concrete numbers behind &quot;why does this add
                  latency.&quot;
                </p>
                <div className="flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
                  {LATENCY_NUMBERS.map((l) => {
                    const pct = (Math.log10(l.nanoseconds) / MAX_LOG_NS) * 100;
                    return (
                      <div key={l.label} className="relative flex items-center justify-between overflow-hidden rounded px-2 py-1">
                        <div
                          className="absolute inset-y-0 left-0 bg-emerald-900/30"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                        <span className="relative z-10 text-[11px] text-zinc-300">{l.label}</span>
                        <span className="relative z-10 text-[11px] font-semibold text-zinc-100">
                          {formatLatency(l.nanoseconds)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {COMPARISON_TABLES.map((t) => (
                <div key={t.id}>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                    {t.title}
                  </div>
                  <p className="mb-2 text-[11px] text-zinc-500">{t.blurb}</p>
                  <div className="overflow-x-auto rounded-md border border-zinc-800">
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-zinc-900">
                          <th className="border-b border-zinc-800 px-2 py-1.5 text-left text-zinc-500"></th>
                          {t.columns.map((c) => (
                            <th key={c} className="border-b border-zinc-800 px-2 py-1.5 text-left font-semibold text-zinc-200">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {t.rows.map((r) => (
                          <tr key={r.feature} className="odd:bg-zinc-900/40">
                            <td className="px-2 py-1.5 font-medium text-zinc-400">{r.feature}</td>
                            {r.values.map((v, i) => (
                              <td key={i} className="px-2 py-1.5 text-zinc-300">
                                {v}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

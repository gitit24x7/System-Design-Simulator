"use client";

import { useEffect, useState } from "react";
import { Check, Copy, TrendingDown, Trash2, X } from "lucide-react";
import { useSysForgeStore } from "@/lib/store";
import {
  getCapTradeoffs,
  getDisplayLabel,
  getEffectiveBaseCost,
  getEffectiveLatencyMs,
  getEffectiveMaxRps,
  getProviderCostMultiplier,
  getSecondaryVariant,
  getSecondaryVariants,
  getVariant,
  getVariants,
  TYPE_LABELS,
  UNLIMITED_RPS,
} from "@/lib/engine";

function TradeoffList({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-[11px]">
      <ul className="space-y-1">
        {pros.map((p) => (
          <li key={p} className="flex gap-1 text-emerald-400">
            <Check size={12} className="mt-0.5 shrink-0" />
            <span className="text-zinc-300">{p}</span>
          </li>
        ))}
      </ul>
      <ul className="space-y-1">
        {cons.map((c) => (
          <li key={c} className="flex gap-1 text-red-400">
            <X size={12} className="mt-0.5 shrink-0" />
            <span className="text-zinc-300">{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NodeInspector() {
  const selectedNodeId = useSysForgeStore((s) => s.selectedNodeId);
  const node = useSysForgeStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId));
  const provider = useSysForgeStore((s) => s.provider);
  const selectNode = useSysForgeStore((s) => s.selectNode);
  const updateNodeVariant = useSysForgeStore((s) => s.updateNodeVariant);
  const updateNodeSecondaryVariant = useSysForgeStore((s) => s.updateNodeSecondaryVariant);
  const updateNodeConsistency = useSysForgeStore((s) => s.updateNodeConsistency);
  const updateNodeDegradation = useSysForgeStore((s) => s.updateNodeDegradation);
  const removeNode = useSysForgeStore((s) => s.removeNode);
  const duplicateNode = useSysForgeStore((s) => s.duplicateNode);
  const renameNode = useSysForgeStore((s) => s.renameNode);

  const [labelDraft, setLabelDraft] = useState("");

  useEffect(() => {
    if (node) setLabelDraft(node.data.customLabel ?? "");
  }, [node?.id]);

  if (!selectedNodeId || !node) return null;

  const variants = getVariants(node.data.type);
  const activeVariant = getVariant(node.data.type, node.data.variant);
  const showVariantSwitcher = variants.length > 1;
  const showConsistencySlider = node.data.type === "database";
  const providerLabel = getDisplayLabel(node.data.type, node.data.variant, provider);
  const capTradeoffs = getCapTradeoffs(node.data.consistency);
  const secondaryAxis = getSecondaryVariants(node.data.type);
  const activeSecondary = secondaryAxis ? getSecondaryVariant(node.data.type, node.data.secondaryVariant) : null;
  const showDegradationSlider = node.data.type !== "client";

  const commitLabel = () => renameNode(node.id, labelDraft);

  return (
    <div className="no-export absolute inset-x-2 bottom-2 z-20 max-h-[75vh] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950/95 p-4 shadow-xl sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-96 sm:max-h-[70vh] sm:-translate-x-1/2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <input
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder={providerLabel}
          className="w-full rounded border border-transparent bg-transparent px-1 text-sm font-semibold text-zinc-100 hover:border-zinc-700 focus:border-zinc-600 focus:bg-zinc-900 focus:outline-none"
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => duplicateNode(node.id)}
            title="Duplicate node"
            className="text-zinc-500 hover:text-emerald-400"
          >
            <Copy size={15} />
          </button>
          <button
            onClick={() => removeNode(node.id)}
            title="Remove node"
            className="text-zinc-500 hover:text-red-400"
          >
            <Trash2 size={15} />
          </button>
          <button onClick={() => selectNode(null)} className="text-zinc-500 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>
      </div>
      <p className="mb-3 text-[11px] text-zinc-500">
        {TYPE_LABELS[node.data.type]}
        {provider !== "generic" && ` • ${providerLabel}`}
      </p>

      {showVariantSwitcher && (
        <div className="mb-3">
          <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Configuration</div>
          <div className="flex gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => updateNodeVariant(node.id, variant.id)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                  node.data.variant === variant.id
                    ? "border-emerald-600 bg-emerald-950/50 text-emerald-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Trade-offs</div>
        <TradeoffList pros={activeVariant.pros} cons={activeVariant.cons} />
      </div>

      {secondaryAxis && (
        <div className="mb-3">
          <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">{secondaryAxis.label}</div>
          <div className="flex flex-wrap gap-2">
            {secondaryAxis.options.map((option) => (
              <button
                key={option.id}
                onClick={() => updateNodeSecondaryVariant(node.id, option.id)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                  node.data.secondaryVariant === option.id
                    ? "border-sky-600 bg-sky-950/50 text-sky-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {activeSecondary && (activeSecondary.pros.length > 0 || activeSecondary.cons.length > 0) && (
            <div className="mt-2">
              <TradeoffList pros={activeSecondary.pros} cons={activeSecondary.cons} />
            </div>
          )}
        </div>
      )}

      {showConsistencySlider && (
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-wide text-zinc-500">
            <span>Eventual</span>
            <span>CAP Consistency</span>
            <span>Strong</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={node.data.consistency}
            onChange={(e) => updateNodeConsistency(node.id, Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="mt-2">
            <TradeoffList pros={capTradeoffs.pros} cons={capTradeoffs.cons} />
          </div>
        </div>
      )}

      {showDegradationSlider && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-zinc-500">
              <TrendingDown size={12} className={node.data.degradation > 0 ? "text-purple-400" : ""} />
              Simulate Degradation
            </div>
            {node.data.degradation > 0 && (
              <button
                onClick={() => updateNodeDegradation(node.id, 0)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                Reset
              </button>
            )}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={node.data.degradation}
            onChange={(e) => updateNodeDegradation(node.id, Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Runs this component slow and over capacity without marking it dead -- tests partial
            failure and latency SLAs, not just outages.
          </p>
        </div>
      )}

      <div className="mt-2 flex gap-3 text-[11px] text-zinc-400">
        <span>{node.data.maxRps >= UNLIMITED_RPS ? "∞" : Math.round(getEffectiveMaxRps(node.data))} rps</span>
        <span>{Math.round(getEffectiveLatencyMs(node.data) * 10) / 10}ms</span>
        <span>
          $
          {Math.round(
            getEffectiveBaseCost(node.data) *
              getProviderCostMultiplier(node.data.type, node.data.variant, provider)
          )}
          /mo
        </span>
      </div>
    </div>
  );
}

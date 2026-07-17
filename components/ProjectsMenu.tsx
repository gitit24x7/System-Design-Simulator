"use client";

import { useState } from "react";
import { FolderOpen, Save, Trash2 } from "lucide-react";
import { useSysForgeStore } from "@/lib/store";

export default function ProjectsMenu() {
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const savedDesigns = useSysForgeStore((s) => s.savedDesigns);
  const saveDesignAs = useSysForgeStore((s) => s.saveDesignAs);
  const loadDesign = useSysForgeStore((s) => s.loadDesign);
  const deleteDesign = useSysForgeStore((s) => s.deleteDesign);

  const names = Object.keys(savedDesigns).sort();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
        title="Save or load named designs"
      >
        <FolderOpen size={14} />
        Projects
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
          <div className="mb-2 flex gap-1">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Design name..."
              maxLength={60}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-emerald-600 focus:outline-none"
            />
            <button
              onClick={() => {
                if (!nameDraft.trim()) return;
                saveDesignAs(nameDraft);
                setNameDraft("");
              }}
              title="Save current design"
              className="flex shrink-0 items-center justify-center rounded border border-zinc-700 px-2 text-emerald-400 hover:border-emerald-600"
            >
              <Save size={13} />
            </button>
          </div>

          {names.length === 0 ? (
            <p className="px-1 py-2 text-[11px] text-zinc-600">No saved designs yet.</p>
          ) : (
            <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {names.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded px-1.5 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
                >
                  <button
                    onClick={() => {
                      loadDesign(name);
                      setOpen(false);
                    }}
                    className="flex-1 truncate text-left"
                  >
                    {name}
                  </button>
                  <button
                    onClick={() => deleteDesign(name)}
                    title="Delete"
                    className="ml-2 text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

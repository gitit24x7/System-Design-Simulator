"use client";

import { NodeProps } from "reactflow";
import { X } from "lucide-react";
import { NoteData, useSysForgeStore } from "@/lib/store";

export default function NoteNode({ id, data }: NodeProps<NoteData>) {
  const updateNoteText = useSysForgeStore((s) => s.updateNoteText);
  const removeNote = useSysForgeStore((s) => s.removeNote);

  return (
    <div className="group relative flex h-32 w-48 flex-col rounded-md border border-amber-700/50 bg-amber-950/80 p-2 shadow-md">
      <button
        onClick={() => removeNote(id)}
        className="absolute right-1 top-1 text-amber-700 opacity-0 transition-opacity hover:text-amber-400 group-hover:opacity-100"
      >
        <X size={12} />
      </button>
      <textarea
        value={data.text}
        onChange={(e) => updateNoteText(id, e.target.value)}
        placeholder="Note why you made this choice..."
        className="nodrag h-full w-full resize-none bg-transparent text-xs text-amber-100 placeholder:text-amber-700/60 focus:outline-none"
      />
    </div>
  );
}

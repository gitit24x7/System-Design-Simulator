import { ComponentType } from "./engine";

// Every component type keeps its own hue (so it's identifiable at a glance
// across a busy canvas) rendered as a gradient rather than a flat fill, for
// a more premium/dimensional badge. Shared between the canvas nodes and the
// sidebar palette so they read as the same icon set, not two different ones.
export const ICON_GRADIENT: Record<ComponentType, string> = {
  client: "from-slate-400 to-slate-600",
  cdn: "from-sky-400 to-sky-600",
  "load-balancer": "from-orange-400 to-orange-600",
  "api-gateway": "from-fuchsia-400 to-fuchsia-600",
  api: "from-blue-400 to-blue-600",
  cache: "from-red-400 to-red-600",
  database: "from-amber-400 to-amber-600",
  "object-storage": "from-yellow-500 to-yellow-700",
  queue: "from-teal-400 to-teal-600",
  "message-broker": "from-purple-400 to-purple-600",
  worker: "from-green-400 to-green-600",
  custom: "from-violet-400 to-violet-600",
};

// An inner highlight (top-left) and shadow (bottom-right) so the badge reads
// as a beveled, physical chip instead of a flat color swatch.
export const BEVEL_SHADOW = "inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(0,0,0,0.35)";

import { ReactElement } from "react";
import { ComponentType } from "@/lib/engine";

// Purpose-built, multi-part glyphs (not single generic library outlines) so
// each component type has a distinct silhouette that reads at a glance --
// a stacked cylinder for a database, a bucket for object storage, a fan-out
// hub for a broker -- rather than everything being "a colored square with
// one icon glyph." Two-tone: PRIMARY for the shape that carries the
// silhouette, SECONDARY for supporting detail, so it reads as a deliberate
// duotone icon against the gradient badge behind it, not a flat sticker.
const PRIMARY = "#ffffff";
const SECONDARY = "rgba(255,255,255,0.55)";

const GLYPHS: Record<ComponentType, ReactElement> = {
  client: (
    <>
      <circle cx="12" cy="8.5" r="3.2" fill={PRIMARY} />
      <path d="M5 20c0-4.5 3.5-7 7-7s7 2.5 7 7" fill={SECONDARY} />
    </>
  ),
  cdn: (
    <>
      <circle cx="12" cy="12" r="7" fill="none" stroke={PRIMARY} strokeWidth="1.6" />
      <ellipse cx="12" cy="12" rx="3" ry="7" fill="none" stroke={PRIMARY} strokeWidth="1.1" opacity="0.85" />
      <path d="M5 12h14" stroke={PRIMARY} strokeWidth="1.1" opacity="0.85" />
      <circle cx="4" cy="7.5" r="1.5" fill={SECONDARY} />
      <circle cx="20" cy="7.5" r="1.5" fill={SECONDARY} />
      <circle cx="4" cy="16.5" r="1.5" fill={SECONDARY} />
      <circle cx="20" cy="16.5" r="1.5" fill={SECONDARY} />
    </>
  ),
  "load-balancer": (
    <>
      <circle cx="4" cy="12" r="2" fill={PRIMARY} />
      <path
        d="M6 12h3.2M9.2 12 15.6 5.2M9.2 12h6.4M9.2 12 15.6 18.8"
        stroke={SECONDARY}
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="17.6" cy="5.2" r="2" fill={PRIMARY} />
      <circle cx="17.6" cy="12" r="2" fill={PRIMARY} />
      <circle cx="17.6" cy="18.8" r="2" fill={PRIMARY} />
    </>
  ),
  "api-gateway": (
    <>
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9V3z" fill={SECONDARY} />
      <path d="M12 3l-7 3v6c0 5 3.5 8 7 9V3z" fill={PRIMARY} opacity="0.4" />
      <path
        d="M8.5 12.4 10.8 14.7 15.5 9.9"
        fill="none"
        stroke={PRIMARY}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  api: (
    <>
      <rect x="4" y="4" width="16" height="4.4" rx="1" fill={PRIMARY} />
      <rect x="4" y="9.8" width="16" height="4.4" rx="1" fill={SECONDARY} />
      <rect x="4" y="15.6" width="16" height="4.4" rx="1" fill={PRIMARY} />
      <circle cx="7" cy="6.2" r="0.9" fill="#22c55e" />
      <circle cx="7" cy="12" r="0.9" fill="#22c55e" />
      <circle cx="7" cy="17.8" r="0.9" fill="#22c55e" />
    </>
  ),
  cache: (
    <>
      <rect x="4" y="5" width="16" height="4.2" rx="1.2" fill={SECONDARY} opacity="0.85" />
      <rect x="4" y="10.4" width="16" height="4.2" rx="1.2" fill={SECONDARY} opacity="0.6" />
      <rect x="4" y="15.8" width="16" height="4.2" rx="1.2" fill={SECONDARY} opacity="0.4" />
      <path d="M13.5 2.5 8.7 11h3.4l-1.4 8L16 10h-3.4z" fill={PRIMARY} />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.6" fill={PRIMARY} />
      <path d="M5 6v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" fill="none" stroke={PRIMARY} strokeWidth="1.6" />
      <path d="M5 11v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5" fill="none" stroke={SECONDARY} strokeWidth="1.6" />
    </>
  ),
  "object-storage": (
    <>
      <path
        d="M5.5 7 6.8 18.2c.1 1 1 1.8 2 1.8h6.4c1 0 1.9-.8 2-1.8L18.5 7"
        fill={SECONDARY}
      />
      <ellipse cx="12" cy="7" rx="6.5" ry="2.2" fill={PRIMARY} />
      <path d="M7.3 11.5h9.4M7.7 15.4h8.6" stroke={PRIMARY} strokeWidth="1.1" opacity="0.6" />
    </>
  ),
  queue: (
    <>
      <rect x="2.5" y="8" width="4" height="8" rx="1" fill={PRIMARY} />
      <rect x="8" y="8" width="4" height="8" rx="1" fill={PRIMARY} opacity="0.75" />
      <rect x="13.5" y="8" width="4" height="8" rx="1" fill={SECONDARY} />
      <path
        d="M19 9.3 21.3 12 19 14.7"
        stroke={PRIMARY}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "message-broker": (
    <>
      <path d="M12 9.4V4M12 14.6V20M14.6 12h5.4M4 12h5.4" stroke={SECONDARY} strokeWidth="1.5" />
      <circle cx="12" cy="4" r="1.7" fill={SECONDARY} />
      <circle cx="12" cy="20" r="1.7" fill={SECONDARY} />
      <circle cx="20" cy="12" r="1.7" fill={SECONDARY} />
      <circle cx="4" cy="12" r="1.7" fill={SECONDARY} />
      <circle cx="12" cy="12" r="2.8" fill={PRIMARY} />
    </>
  ),
  worker: (
    <>
      <g fill={SECONDARY}>
        <rect x="10.7" y="2.4" width="2.6" height="4" rx="1" />
        <rect x="10.7" y="17.6" width="2.6" height="4" rx="1" />
        <rect x="10.7" y="2.4" width="2.6" height="4" rx="1" transform="rotate(90 12 12)" />
        <rect x="10.7" y="17.6" width="2.6" height="4" rx="1" transform="rotate(90 12 12)" />
        <rect x="10.7" y="2.4" width="2.6" height="4" rx="1" transform="rotate(45 12 12)" />
        <rect x="10.7" y="17.6" width="2.6" height="4" rx="1" transform="rotate(45 12 12)" />
        <rect x="10.7" y="2.4" width="2.6" height="4" rx="1" transform="rotate(-45 12 12)" />
        <rect x="10.7" y="17.6" width="2.6" height="4" rx="1" transform="rotate(-45 12 12)" />
      </g>
      <circle cx="12" cy="12" r="5.1" fill={PRIMARY} />
      <circle cx="12" cy="12" r="2.1" fill={SECONDARY} />
    </>
  ),
  custom: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" fill={PRIMARY} />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" fill={SECONDARY} />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" fill={SECONDARY} />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" fill={PRIMARY} />
    </>
  ),
};

export default function ComponentIcon({ type, size = 22 }: { type: ComponentType; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {GLYPHS[type]}
    </svg>
  );
}

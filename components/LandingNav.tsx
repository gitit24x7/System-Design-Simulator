"use client";

import Link from "next/link";

const NAV_LINKS = [
  { label: "FEATURES", href: "#features" },
  { label: "HOW_IT_WORKS", href: "#how-it-works" },
  { label: "REVIEWS", href: "#reviews" },
];

export default function LandingNav() {
  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b-[2.5px] border-[#0a0a0a] px-4 sm:h-[76px] sm:px-[60px]">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="h-[18px] w-[18px] shrink-0 bg-[#0a0a0a] sm:h-[22px] sm:w-[22px]" />
        <span className="truncate text-[11px] font-bold tracking-[0.02em] text-[#0a0a0a] sm:whitespace-nowrap sm:text-[15px]">
          SYSTEM_DESIGN_SIMULATOR
        </span>
      </div>
      <nav className="flex shrink-0 items-center gap-8">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hidden whitespace-nowrap text-[12.5px] font-semibold text-[#0a0a0a] md:block"
          >
            {link.label}
          </a>
        ))}
        <Link
          href="/app"
          className="sds-btn-shine cursor-pointer whitespace-nowrap px-2.5 py-2 text-[10px] font-bold text-white transition-transform hover:scale-[1.06] sm:px-4 sm:py-[9px] sm:text-[12.5px]"
        >
          [ START_FREE ]
        </Link>
      </nav>
    </header>
  );
}

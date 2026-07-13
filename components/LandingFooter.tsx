import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t-[2.5px] border-[#0a0a0a] px-6 py-6 text-center sm:px-[60px]">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0a0a0a]">
        <Link href="/about" className="hover:text-[#4285F4]">
          About
        </Link>
        <Link href="/privacy" className="hover:text-[#EA4335]">
          Privacy
        </Link>
        <a href="https://byoos.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#4285F4]">
          Byoos
        </a>
        <a href="https://reactmaster.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-[#EA4335]">
          ReactMastery
        </a>
        <a href="https://psachno.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#FBBC05]">
          psachno.vercel.app
        </a>
        <a href="https://sprintmagic.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#34A853]">
          SprintMagic
        </a>
      </div>
      <p className="text-[11.5px] text-[#3a3a3a]">© 2026 SYSTEM_DESIGN_SIMULATOR</p>
    </footer>
  );
}

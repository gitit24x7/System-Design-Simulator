import { JetBrains_Mono } from "next/font/google";
import "../landing.css";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata = {
  title: "Privacy — System Design Simulator",
  description: "How System Design Simulator handles your data.",
};

const SECTIONS = [
  {
    title: "What we collect",
    body: "Nothing, on our end. There are no user accounts, no sign-up forms, and no server-side database. This site does not run analytics or tracking scripts and does not use cookies to identify you.",
  },
  {
    title: "Where your designs live",
    body: "Everything you build — nodes, connections, sticky notes, annotations, and saved projects — is stored locally in your browser's localStorage, on your device only. Nobody else can see it, and it never touches a server.",
  },
  {
    title: "Share links",
    body: "The Share button encodes your current design into the URL itself (as a compressed, encoded parameter). Anyone with that link can open and view the design it contains. Don't share a link to a design you consider private.",
  },
  {
    title: "Clearing your data",
    body: "Clearing your browser's site data for this app removes everything: your saved designs, onboarding state, and preferences. There is no account to delete because there is no account.",
  },
  {
    title: "Third-party links",
    body: "The footer links to other independent projects (Byoos, ReactMastery, psachno.vercel.app, SprintMagic). Those sites are not operated by us and have their own privacy practices — this policy only covers System Design Simulator.",
  },
  {
    title: "Changes",
    body: "If this project ever adds accounts, analytics, or server-side storage, this page will be updated to say so plainly before that data collection begins.",
  },
];

export default function PrivacyPage() {
  return (
    <div className={`${jetbrainsMono.className} w-full overflow-x-hidden bg-white`}>
      <LandingNav />
      <main className="mx-auto flex max-w-[760px] flex-col gap-8 px-6 py-16 sm:px-[60px] sm:py-[76px]">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-[0.1em] text-[#4285F4]">// LEGAL</p>
          <h1 className="text-[32px] font-bold uppercase leading-[1.1] text-[#0a0a0a] sm:text-[42px]">
            Privacy Policy
          </h1>
          <p className="text-[12.5px] text-[#3a3a3a]">Last updated: 2026</p>
        </div>

        <div className="flex flex-col border-2 border-[#0a0a0a]">
          {SECTIONS.map((s, i) => (
            <div
              key={s.title}
              className={`flex flex-col gap-2 p-6 ${i < SECTIONS.length - 1 ? "border-b-2 border-[#0a0a0a]" : ""}`}
            >
              <h2 className="text-[15px] font-bold uppercase text-[#0a0a0a]">{s.title}</h2>
              <p className="text-[13.5px] leading-[1.65] text-[#3a3a3a]">{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

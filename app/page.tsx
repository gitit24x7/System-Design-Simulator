import { JetBrains_Mono } from "next/font/google";
import "./landing.css";
import LandingNav from "@/components/LandingNav";
import LandingHero from "@/components/LandingHero";
import LandingFeatures from "@/components/LandingFeatures";
import LandingHowItWorks from "@/components/LandingHowItWorks";
import LandingTestimonials from "@/components/LandingTestimonials";
import LandingCta from "@/components/LandingCta";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export default function LandingPage() {
  return (
    <div className={`${jetbrainsMono.className} w-full overflow-x-hidden bg-white`}>
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingCta />
      <footer className="px-6 py-6 text-center text-[11.5px] text-[#3a3a3a] sm:px-[60px]">
        © 2026 SYSTEM_DESIGN_SIMULATOR
      </footer>
    </div>
  );
}

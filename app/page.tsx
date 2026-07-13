import { JetBrains_Mono } from "next/font/google";
import "./landing.css";
import LandingNav from "@/components/LandingNav";
import LandingHero from "@/components/LandingHero";
import LandingFeatures from "@/components/LandingFeatures";
import LandingHowItWorks from "@/components/LandingHowItWorks";
import LandingTestimonials from "@/components/LandingTestimonials";
import LandingCta from "@/components/LandingCta";
import LandingFooter from "@/components/LandingFooter";

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
      <LandingFooter />
    </div>
  );
}

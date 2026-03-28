import { AstrologyBackground } from "@/components/astrology-background"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { BlurredGallery } from "@/components/blurred-gallery"
import { FeaturesSection } from "@/components/features-section"
import { StickyCTA } from "@/components/sticky-cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0C] z-0 text-[#F9F9F7] font-sans selection:bg-[#D4AF37]/30">
      <AstrologyBackground />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <BlurredGallery />
      <Footer />
      <StickyCTA />
    </main>
  )
}

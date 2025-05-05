import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
import HeroSection from "@/components/hero/HeroSection";
import AnimatedContainer from "@/components/layout/AnimatedContainer";
import AnimatedSection from "@/components/layout/AnimatedSection";
import FeatureHighlights from "@/components/highlights/features/FeatureHighlights";
import DestinationHighlights from "@/components/highlights/DestinationHighlights";
import FeaturedActivities from "@/components/highlights/activities/FeaturedActivities";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <HeroSection />
      <AnimatedContainer>
        <AnimatedSection>
          <FeatureHighlights />
        </AnimatedSection>
        <AnimatedSection>
          <DestinationHighlights />
        </AnimatedSection>
        <AnimatedSection>
          <FeaturedActivities />
        </AnimatedSection>
      </AnimatedContainer>
      <Footer />
    </main>
  )
}
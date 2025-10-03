import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
import HeroSection from "@/components/hero/HeroSection";
import FeatureHighlights from "@/components/highlights/features/FeatureHighlights";
import DestinationHighlights from "@/components/highlights/DestinationHighlights";
import FeaturedActivities from "@/components/highlights/activities/FeaturedActivities";
import FeaturedEvents from "@/components/highlights/events/FeaturedEvents";
import FeaturedRestaurants from "@/components/highlights/restaurants/FeaturedRestaurants";

import FeaturedVehicles from "@/components/highlights/vehicles/FeaturedVehicles";
import BookingCTA from "@/components/cta/BookingCTA";
import { GuidePopupManager } from "@/components/guide/GuidePopupManager";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
      <Header />
      <HeroSection />
      <FeatureHighlights />
      <DestinationHighlights />
      <FeaturedEvents />
      <FeaturedRestaurants />
      <FeaturedVehicles />
      <FeaturedActivities />
      <BookingCTA />
      <Footer />
      
      {/* Guide Subscription Popup */}
      <GuidePopupManager />
    </main>
  )
}
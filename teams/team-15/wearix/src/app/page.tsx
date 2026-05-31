import HeroSection from '@/components/home/HeroSection';
import MarqueeSection from '@/components/home/MarqueeSection';
import NewArrivalsSection from '@/components/home/NewArrivalsSection';
import BrandStorySection from '@/components/home/BrandStorySection';
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection';
import CollectionsSection from '@/components/home/CollectionsSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import StayConnectedSection from '@/components/home/StayConnectedSection';

export default function HomePage() {
  return (
    <>
      {/* 1. Hero Mood-Slider */}
      <HeroSection />

      {/* 2. Concept Marquee */}
      <MarqueeSection />

      {/* 3. New Arrivals Drop */}
      <NewArrivalsSection />

      {/* 4. Brand Story */}
      <BrandStorySection />

      {/* 5. Signature Best Sellers */}
      <FeaturedProductsSection />

      {/* 6. Collections */}
      <CollectionsSection />

      {/* 7. Testimonials */}
      <ReviewsSection />

      {/* 8. Design Features */}
      <FeaturesSection />

      {/* 9. Social Community & Newsletter */}
      <StayConnectedSection />
    </>
  );
}

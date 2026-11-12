import { AppointmentSection } from "@/components/appointment-section";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { LatestWorks } from "@/components/latest-works";
import { QuoteSection } from "@/components/quote-section";
import { ServiceFlipCards } from "@/components/service-flip-cards";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import { WhatWeDo } from "@/components/what-we-do";

export default function Home() {
  return (
    <>
      <SiteHeader centerLogo />
      <main>
        <HeroSlideshow />
        <QuoteSection />
        <ServiceFlipCards />
        <LatestWorks />
        <TestimonialsCarousel />
        <WhatWeDo />
        <AppointmentSection />
      </main>
      <SiteFooter />
    </>
  );
}

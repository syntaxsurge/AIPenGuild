'use client'

import CallToActionSection from '@/components/home/CallToActionSection'
import FAQSection from '@/components/home/FAQSection'
import FeaturedAICreationsSection from '@/components/home/FeaturedAICreationsSection'
import GallerySection from '@/components/home/GallerySection'
import GettingStartedSection from '@/components/home/GettingStartedSection'
import HeroSection from '@/components/home/HeroSection'
import IntroductionSection from '@/components/home/IntroductionSection'
import KeyFeaturesSection from '@/components/home/KeyFeaturesSection'
import LeaderboardCTASection from '@/components/home/LeaderboardCTASection'
import WhatIsAIPenGuildSection from '@/components/home/WhatIsAIPenGuildSection'
import WhyAIPenGuildSection from '@/components/home/WhyAIPenGuildSection'
import WorkflowOverviewSection from '@/components/home/WorkflowOverviewSection'

export default function Home() {
  return (
    <>
      {/* 1) Hero Section */}
      <HeroSection />

      {/* 2) Introduction Section */}
      <IntroductionSection />

      {/* 3) What is AIPenGuild */}
      <WhatIsAIPenGuildSection />

      {/* 4) Key Features */}
      <KeyFeaturesSection />

      {/* 5) Featured AI Creations Section */}
      <FeaturedAICreationsSection />

      {/* 6) Workflow Overview */}
      <WorkflowOverviewSection />

      {/* 7) Getting Started */}
      <GettingStartedSection />

      {/* 8) Why AIPenGuild */}
      <WhyAIPenGuildSection />

      {/* 9) FAQ Section */}
      <FAQSection />

      {/* 10) Gallery */}
      <GallerySection />

      {/* 11) Leaderboard + Dashboard CTA */}
      <LeaderboardCTASection />

      {/* 12) Call to Action */}
      <CallToActionSection />
    </>
  )
}

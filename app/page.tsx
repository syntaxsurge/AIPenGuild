"use client"

import HeroSection from "@/components/home/HeroSection"
import IntroductionSection from "@/components/home/IntroductionSection"
import WhatIsAIPenGuildSection from "@/components/home/WhatIsAIPenGuildSection"
import KeyFeaturesSection from "@/components/home/KeyFeaturesSection"
import FeaturedAICreationsSection from "@/components/home/FeaturedAICreationsSection"
import WorkflowOverviewSection from "@/components/home/WorkflowOverviewSection"
import GettingStartedSection from "@/components/home/GettingStartedSection"
import WhyAIPenGuildSection from "@/components/home/WhyAIPenGuildSection"
import FAQSection from "@/components/home/FAQSection"
import GallerySection from "@/components/home/GallerySection"
import LeaderboardCTASection from "@/components/home/LeaderboardCTASection"
import CallToActionSection from "@/components/home/CallToActionSection"

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
'use client'

import HeroSection from '@/components/home/HeroSection'
import WhatIsAIPenGuildSection from '@/components/home/WhatIsAIPenGuildSection'
import KeyFeaturesSection from '@/components/home/KeyFeaturesSection'
import WorkflowOverviewSection from '@/components/home/WorkflowOverviewSection'
import GallerySection from '@/components/home/GallerySection'
import GettingStartedSection from '@/components/home/GettingStartedSection'
import CallToActionSection from '@/components/home/CallToActionSection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <WhatIsAIPenGuildSection />
      <KeyFeaturesSection />
      <WorkflowOverviewSection />
      <GallerySection />
      <GettingStartedSection />
      <CallToActionSection />
    </>
  )
}
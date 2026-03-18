"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import HeroSection from "./HeroSection";
import StatsSection from "./StatsSection";
import AboutSection from "./AboutSection";
import CoursesSection from "./CoursesSection";
import FranchiseSection from "./FranchiseSection";
import OffersSection from "./OffersSection";
import GallerySection from "./GallerySection";
import TestimonialsSection from "./TestimonialsSection";
import CTAStrip from "./CTAStrip";

/**
 * User Panel home content (navbar/footer are in layout).
 */
export default function UserDashboard() {
  const config = useUserPanelConfig();
  const { user } = useAuth();
  const userName = user?.fullName ?? null;

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <>
      <HeroSection config={config} userName={userName} />
      <StatsSection config={config} />
      <AboutSection config={config} />
      <CoursesSection config={config} />
      <FranchiseSection config={config} />
      <OffersSection config={config} />
      <TestimonialsSection />
      <GallerySection config={config} />
      <CTAStrip />
    </>
  );
}

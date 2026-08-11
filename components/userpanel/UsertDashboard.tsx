"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import HeroSection from "./HeroSection";
import StatsSection from "./StatsSection";
import AboutSection from "./AboutSection";
import CoursesSection from "./CoursesSection";

const FranchiseSection = dynamic(() => import("./FranchiseSection"));
const OffersSection = dynamic(() => import("./OffersSection"));
const TestimonialsSection = dynamic(() => import("./TestimonialsSection"));
const GallerySection = dynamic(() => import("./GallerySection"));
const CTAStrip = dynamic(() => import("./CTAStrip"));

/**
 * User Panel home content (navbar/footer are in layout).
 */
export default function UserDashboard() {
  const config = useUserPanelConfig();
  const { user } = useAuth();
  const userName = user?.fullName ?? null;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
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

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { defaultConfig } from "@/config/userpanel.config";
import type { UserPanelConfig } from "@/config/userpanel.config";
import PageLoader from "@/components/common/PageLoader";

function mergeConfig(data: unknown): UserPanelConfig {
  if (!data || typeof data !== "object") return defaultConfig;
  const c = data as Record<string, unknown>;
  return {
    welcomePopup: (c.welcomePopup as UserPanelConfig["welcomePopup"]) ?? defaultConfig.welcomePopup,
    site: { ...defaultConfig.site, ...(c.site as UserPanelConfig["site"]) },
    nav: (c.nav as UserPanelConfig["nav"]) ?? defaultConfig.nav,
    hero: (c.hero as UserPanelConfig["hero"]) ?? defaultConfig.hero,
    stats: Array.isArray(c.stats) ? (c.stats as UserPanelConfig["stats"]) : defaultConfig.stats,
    about: (c.about as UserPanelConfig["about"]) ?? defaultConfig.about,
    courses: (c.courses as UserPanelConfig["courses"]) ?? defaultConfig.courses,
    franchise: (c.franchise as UserPanelConfig["franchise"]) ?? defaultConfig.franchise,
    offers: (c.offers as UserPanelConfig["offers"]) ?? defaultConfig.offers,
    gallery: (c.gallery as UserPanelConfig["gallery"]) ?? defaultConfig.gallery,
    testimonials: (c.testimonials as UserPanelConfig["testimonials"]) ?? defaultConfig.testimonials,
    footer: (c.footer as UserPanelConfig["footer"]) ?? defaultConfig.footer,
  };
}

const UserPanelConfigContext = createContext<UserPanelConfig>(defaultConfig);

export function UserPanelConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<UserPanelConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/userpanel-config")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data) setConfig(mergeConfig(res.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="userpanel">
        <PageLoader text="Setting up your portal..." />
      </div>
    );
  }

  return (
    <UserPanelConfigContext.Provider value={config}>
      {children}
    </UserPanelConfigContext.Provider>
  );
}

export function useUserPanelConfig() {
  const ctx = useContext(UserPanelConfigContext);
  if (!ctx) throw new Error("useUserPanelConfig must be used within UserPanelConfigProvider");
  return ctx;
}

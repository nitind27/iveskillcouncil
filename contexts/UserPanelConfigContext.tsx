"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { defaultConfig } from "@/config/userpanel.config";
import type { UserPanelConfig } from "@/config/userpanel.config";

const SESSION_CACHE_KEY = "up_config_v4";

function mergeConfig(data: unknown): UserPanelConfig {
  if (!data || typeof data !== "object") return defaultConfig;
  const c = data as Record<string, unknown>;
  return {
    welcomePopup: (c.welcomePopup as UserPanelConfig["welcomePopup"]) ?? defaultConfig.welcomePopup,
    site: { ...defaultConfig.site, ...(c.site as UserPanelConfig["site"]) },
    nav: {
      links:
        Array.isArray((c.nav as UserPanelConfig["nav"])?.links) &&
        (c.nav as UserPanelConfig["nav"]).links.length > 0
          ? (c.nav as UserPanelConfig["nav"]).links
          : defaultConfig.nav.links,
    },
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

function readSessionCache(): UserPanelConfig | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    return mergeConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

const UserPanelConfigContext = createContext<UserPanelConfig>(defaultConfig);

export function UserPanelConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<UserPanelConfig>(defaultConfig);

  useEffect(() => {
    const cached = readSessionCache();
    if (cached) setConfig(cached);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    fetch("/api/userpanel-config", { signal: controller.signal })
      .then((r) => r.json())
      .then((res) => {
        if (!res?.data) return;
        const next = mergeConfig(res.data);
        setConfig(next);
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(res.data));
        } catch {
          // ignore quota / private mode
        }
      })
      .catch(() => {})
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

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

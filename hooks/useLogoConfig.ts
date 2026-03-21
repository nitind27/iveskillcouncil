"use client";

import { useState, useEffect } from "react";

export interface LogoConfig {
  logoUrl: string | null;
  siteName: string;
  tagline?: string;
}

/** Fetches logo/site config from userpanel (public API). Same logo used in user panel, login, admin. */
export function useLogoConfig(): LogoConfig {
  const [config, setConfig] = useState<LogoConfig>({
    logoUrl: null,
    siteName: "Edu Institute",
    tagline: "",
  });

  useEffect(() => {
    fetch("/api/userpanel-config")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.site) {
          const s = res.data.site;
          setConfig({
            logoUrl: s.logoUrl || null,
            siteName: s.name || "Edu Institute",
            tagline: s.tagline || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  return config;
}

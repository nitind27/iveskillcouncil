"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchWithDbRetry,
  refreshSession,
  refreshSessionDetailed,
} from "@/lib/session-client";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  roleId: number;
  roleName: string;
  franchiseId?: string;
  franchise?: {
    id: string;
    name: string;
    status: string;
    state?: string | null;
  } | null;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** True while DB is unreachable — session cookies may still be valid */
  dbUnavailable: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{
    ok: boolean;
    error?: string;
    requiresOtp?: boolean;
    email?: string;
  }>;
  loginWithOtp: (email: string, otp: string) => Promise<boolean>;
  /** Admin (Institute) only — complete login after password + email OTP */
  verifyAdminOtp: (email: string, otp: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isPublicPath(path: string) {
  return path === "/" || path === "/login" || path.startsWith("/userpanel");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const router = useRouter();
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const fetchMe = useCallback(async (): Promise<User | null> => {
    const res = await fetchWithDbRetry("/api/auth/me", { credentials: "include" }, {
      retries: 6,
      baseDelayMs: 600,
    });

    if (res.status === 503) {
      setDbUnavailable(true);
      // Keep existing session in memory; cookies may still be valid once DB returns
      if (userRef.current) return userRef.current;
      return null;
    }

    setDbUnavailable(false);

    if (res.status === 401) {
      const refreshed = await refreshSessionDetailed();
      if (refreshed === "unavailable") {
        setDbUnavailable(true);
        if (userRef.current) return userRef.current;
        return null;
      }
      if (refreshed !== "ok") return null;

      const retry = await fetchWithDbRetry("/api/auth/me", { credentials: "include" });
      if (retry.status === 503) {
        setDbUnavailable(true);
        if (userRef.current) return userRef.current;
        return null;
      }
      if (!retry.ok) return null;
      const retryData = await retry.json();
      return retryData.success && retryData.data ? retryData.data : null;
    }

    if (!res.ok) {
      // Transient server errors — keep existing session if we already have one
      if (userRef.current) return userRef.current;
      return null;
    }

    const data = await res.json();
    return data.success && data.data ? data.data : null;
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const nextUser = await fetchMe();
      // Only clear user on confirmed auth failure (null after retries, and not DB blip with cookies)
      setUser(nextUser);
    } catch {
      // Network blip — do not wipe an existing logged-in user
      if (!userRef.current) setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchMe]);

  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const isPublic = isPublicPath(path);

    if (isPublic && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => checkAuth(), { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    checkAuth();
  }, [checkAuth]);

  // While DB was down, keep probing so session restores without re-login
  useEffect(() => {
    if (!dbUnavailable) return;

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const next = await fetchMe();
        if (cancelled) return;
        if (next) {
          setUser(next);
          setDbUnavailable(false);
        }
      } catch {
        /* keep probing */
      }
    };

    const id = window.setInterval(tick, 4000);
    tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [dbUnavailable, fetchMe]);

  // Silent keep-alive: refresh tokens every 20 minutes while tab is open
  useEffect(() => {
    const KEEP_ALIVE_MS = 20 * 60 * 1000;

    const tick = async () => {
      if (document.visibilityState === "hidden") return;
      if (!userRef.current) return;
      await refreshSession();
    };

    const id = window.setInterval(tick, KEEP_ALIVE_MS);

    const onFocus = () => {
      if (userRef.current) refreshSession();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{
    ok: boolean;
    error?: string;
    requiresOtp?: boolean;
    email?: string;
  }> => {
    try {
      const res = await fetchWithDbRetry(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        },
        { retries: 5, baseDelayMs: 700 }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        if (res.status === 503) {
          setDbUnavailable(true);
          return {
            ok: false,
            error:
              data?.error ||
              "Database unreachable. Run npm run dev (starts DB proxy), wait a few seconds, then retry.",
          };
        }
        return {
          ok: false,
          error: data?.error || "Invalid email or password",
        };
      }

      setDbUnavailable(false);

      // Admin (Institute): password OK, wait for email OTP — no session yet
      if (data.data?.requiresOtp) {
        return {
          ok: true,
          requiresOtp: true,
          email: data.data.email || email,
        };
      }

      if (data.data?.user) {
        setUser(data.data.user);
        return { ok: true };
      }

      return { ok: false, error: "Login failed" };
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, error: "Network error. Please try again." };
    }
  };

  const verifyAdminOtp = async (
    email: string,
    otp: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetchWithDbRetry(
        "/api/auth/verify-admin-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, otp }),
        },
        { retries: 4, baseDelayMs: 600 }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { ok: false, error: data?.error || "Invalid or expired OTP" };
      }
      if (data.data?.user) {
        setDbUnavailable(false);
        setUser(data.data.user);
        return { ok: true };
      }
      return { ok: false, error: "Login failed" };
    } catch (error) {
      console.error("Admin OTP verify error:", error);
      return { ok: false, error: "Network error. Please try again." };
    }
  };

  const loginWithOtp = async (email: string, otp: string): Promise<boolean> => {
    try {
      const res = await fetchWithDbRetry(
        "/api/auth/verify-otp-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, otp }),
        },
        { retries: 4, baseDelayMs: 600 }
      );

      const data = await res.json();

      if (!res.ok || !data.success) return false;

      if (data.data?.user) {
        setDbUnavailable(false);
        setUser(data.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error("OTP Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setDbUnavailable(false);
      router.push("/login");
      router.refresh();
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        dbUnavailable,
        login,
        loginWithOtp,
        verifyAdminOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

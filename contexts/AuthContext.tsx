"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  fullName: string;
  roleId: number;
  roleName: string;
  franchiseId?: string;
  franchise?: {
    id: string;
    name: string;
    status: string;
  } | null;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: 'include', // Important: Include cookies
      });
      
      // 401 is EXPECTED when user is not logged in - this is normal behavior
      // Browser console may show 401 as an error, but it's not a problem
      if (res.status === 401) {
        // User is not authenticated - this is normal, not an error
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (res.ok) {
        try {
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
          } else {
            setUser(null);
          }
        } catch (parseError) {
          // JSON parse error - set user to null
          setUser(null);
        }
      } else {
        // Other HTTP errors (not 401) - set user to null
        setUser(null);
      }
    } catch (error) {
      // Network errors are fine - user just not logged in or server unreachable
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("🔐 Attempting login for:", email);
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Important: Include cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Login failed:", data);
        return false;
      }

      if (res.ok && data.success) {
        console.log("✅ Login successful, setting user...");
        
        // Set user from response
        if (data.data && data.data.user) {
          setUser(data.data.user);
          console.log("✅ User set in context");
        }
        
        // Return true immediately - let login page handle cookie verification
        // The login page will verify cookies before redirecting
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("❌ Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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


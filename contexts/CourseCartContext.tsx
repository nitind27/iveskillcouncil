"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CourseItem } from "@/config/userpanel.config";

const CART_KEY = "userpanel_course_cart";

type CartItem = { course: CourseItem };

const CourseCartContext = createContext<{
  items: CartItem[];
  add: (course: CourseItem) => void;
  remove: (courseId: string) => void;
  clear: () => void;
  has: (courseId: string) => boolean;
} | null>(null);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
}

export function CourseCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(next);
  }, []);

  const add = useCallback(
    (course: CourseItem) => {
      persist([
        ...items.filter((i) => i.course.id !== course.id),
        { course },
      ]);
    },
    [items, persist]
  );

  const remove = useCallback(
    (courseId: string) => {
      persist(items.filter((i) => i.course.id !== courseId));
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const has = useCallback(
    (courseId: string) => items.some((i) => i.course.id === courseId),
    [items]
  );

  return (
    <CourseCartContext.Provider value={{ items, add, remove, clear, has }}>
      {children}
    </CourseCartContext.Provider>
  );
}

export function useCourseCart() {
  const ctx = useContext(CourseCartContext);
  if (!ctx) throw new Error("useCourseCart must be used within CourseCartProvider");
  return ctx;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect to students page with add modal - Add Student form opens in modal. */
export default function AddStudentRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/students?add=1");
  }, [router]);
  return null;
}

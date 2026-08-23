"use client";

import Link from "next/link";
import { ErrorPage } from "@/components/common/error";
import { useAuth } from "@/contexts/AuthContext";

export default function ForbiddenPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <ErrorPage
        statusCode={403}
        message={
          user
            ? "Aapke role ke paas is page ki permission nahi hai. Dashboard par wapas jayein."
            : "You don't have permission to access this resource."
        }
        showHomeButton={!user}
      />
      {user && (
        <div className="-mt-32 flex justify-center pb-12">
          <Link
            href="/dashboard"
            className="rounded-xl bg-[#1E4A85] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#163A6B]"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

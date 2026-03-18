import React from "react";
import Link from "next/link";

export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">500 – Server error</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our side. Please try again.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/userpanel"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Home
          </Link>
          <a
            href="javascript:location.reload()"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Reload
          </a>
        </div>
      </div>
    </div>
  );
}


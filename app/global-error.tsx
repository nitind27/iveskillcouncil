"use client";

import { ErrorPage } from "@/components/common/error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorPage
          statusCode={500}
          title="Critical Error"
          message="A critical error occurred. Please refresh the page or contact support."
          showHomeButton={true}
          showBackButton={false}
        />
      </body>
    </html>
  );
}


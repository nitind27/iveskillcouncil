"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/common/error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error:", error);
  }, [error]);

  return (
    <ErrorPage
      statusCode={500}
      title="Something went wrong!"
      message={error.message || "An unexpected error occurred. Please try again."}
      showHomeButton={true}
      showBackButton={true}
    />
  );
}


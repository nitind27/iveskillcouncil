import { ErrorPage } from "@/components/common/error";

export default function ServiceUnavailablePage() {
  return <ErrorPage statusCode={503} />;
}


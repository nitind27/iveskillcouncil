import { ErrorPage } from "@/components/common/error";

export default function ForbiddenPage() {
  return <ErrorPage statusCode={403} />;
}


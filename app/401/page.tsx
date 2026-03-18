import { ErrorPage } from "@/components/common/error";

export default function UnauthorizedPage() {
  return <ErrorPage statusCode={401} />;
}


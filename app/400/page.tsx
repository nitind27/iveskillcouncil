import { ErrorPage } from "@/components/common/error";

export default function BadRequestPage() {
  return <ErrorPage statusCode={400} />;
}


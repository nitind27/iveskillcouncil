import PageLoader from "@/components/common/PageLoader";

/** Shown while any route's page content is loading. */
export default function Loading() {
  return <PageLoader text="Loading..." />;
}

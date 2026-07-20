// Per-route streaming fallback. Renders while the root page is suspended.
import { HomeLoading } from "@/components/route-loading/route-skeletons";

export default function Loading() {
  return <HomeLoading />;
}

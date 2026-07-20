// Per-route loading fallbacks. Each one re-uses shape-matched skeletons from
// `components/ui/skeleton.tsx` so the streaming fallback mirrors the resolved
// page layout (no jarring spinner-to-content flash).
"use client";

import {
  CatalogRouteSkeleton,
  DocPageSkeleton,
  MarketingRouteSkeleton,
  PlaygroundRouteSkeleton,
} from "@/components/ui/skeleton";

export function HomeLoading() {
  return <MarketingRouteSkeleton />;
}

export function AboutLoading() {
  return <MarketingRouteSkeleton />;
}

export function BlogLoading() {
  return <CatalogRouteSkeleton rows={4} />;
}

export function ChangelogLoading() {
  return <CatalogRouteSkeleton rows={5} />;
}

export function ContactLoading() {
  return <MarketingRouteSkeleton />;
}

export function EnterpriseLoading() {
  return <MarketingRouteSkeleton />;
}

export function GatewayLoading() {
  return <MarketingRouteSkeleton />;
}

export function LegalLoading() {
  return <MarketingRouteSkeleton />;
}

export function PricingLoading() {
  return <MarketingRouteSkeleton />;
}

export function RoadmapLoading() {
  return <CatalogRouteSkeleton rows={5} />;
}

export function StatusLoading() {
  return <MarketingRouteSkeleton />;
}

export function ModelsLoading() {
  return <CatalogRouteSkeleton rows={9} />;
}

export function PlaygroundLoading() {
  return <PlaygroundRouteSkeleton />;
}

export function DocsLoading() {
  return <DocPageSkeleton />;
}

export function DocsChildLoading() {
  return <DocPageSkeleton />;
}

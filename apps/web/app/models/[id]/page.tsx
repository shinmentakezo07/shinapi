"use client";

import { use, useMemo } from "react";
import { ModelDetailClient } from "@/components/models/detail/ModelDetailClient";
import { getProviderId } from "@/lib/model-utils";
import { useModelCatalog } from "@/lib/api/hooks";
import { mapCatalogToOpenRouter } from "@/lib/api/model-catalog";

export default function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const modelId = decodeURIComponent(id);
  const { data: catalog, isLoading } = useModelCatalog();

  const model = useMemo(() => {
    if (!catalog) return null;
    const mapped = mapCatalogToOpenRouter(catalog);
    return mapped.find((m) => m.id === modelId) ?? null;
  }, [catalog, modelId]);

  const providerId = model ? getProviderId(model.id) : null;

  if (isLoading && !model) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
      </div>
    );
  }

  return <ModelDetailClient model={model} providerId={providerId} />;
}

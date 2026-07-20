import type { Metadata } from "next";
import { ModelsExplorer } from "@/components/models/ModelsExplorer";
import { ModelsRouteSkeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Model Registry — Yapapa",
  description:
    "Browse AI models with transparent per-token pricing. Compare capabilities, context windows, and costs.",
};

function LoadingFallback() {
  return <ModelsRouteSkeleton />;
}

export default function ModelsPage() {
  return (
    <div className="flex flex-col items-center w-full overflow-hidden bg-[#030303] text-foreground selection:bg-primary/30 selection:text-white">
      <Suspense fallback={<LoadingFallback />}>
        <ModelsExplorer />
      </Suspense>
    </div>
  );
}

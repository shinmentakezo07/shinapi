import { describe, it, expect } from "vitest";
import {
  normalizeModelInfo,
  modelInfoToOpenRouterShape,
  modelInfoToEnriched,
  mapCatalogToEnriched,
  mapCatalogToOpenRouter,
} from "@/lib/api/model-catalog";

describe("model-catalog adapter", () => {
  it("normalizes snake_case runtime fields", () => {
    const m = normalizeModelInfo({
      id: "openai/gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      input_price_per_1k: 2.5,
      output_price_per_1k: 10,
      context_window: 128000,
      description: "flagship",
      capabilities: ["tools"],
    });
    expect(m.id).toBe("openai/gpt-4o");
    expect(m.inputPricePer1k).toBe(2.5);
    expect(m.outputPricePer1k).toBe(10);
    expect(m.contextWindow).toBe(128000);
  });

  it("preserves fully-qualified model ids", () => {
    const m = modelInfoToEnriched(
      normalizeModelInfo({
        id: "custom/my-model",
        name: "My Model",
        provider: "custom",
        context_window: 8192,
      }),
    );
    expect(m.id).toBe("custom/my-model");
    expect(m.provider).toBe("custom");
  });

  it("maps pricing to per-token strings for OpenRouter UI", () => {
    const shape = modelInfoToOpenRouterShape(
      normalizeModelInfo({
        id: "p/m",
        name: "M",
        provider: "p",
        inputPricePer1k: 1, // $1 / 1k tokens
        outputPricePer1k: 2,
        contextWindow: 1000,
      }),
    );
    expect(shape.pricing.prompt).toBe("0.001");
    expect(shape.pricing.completion).toBe("0.002");
    expect(shape.context_length).toBe(1000);
  });

  it("filters empty ids from catalog maps", () => {
    const enriched = mapCatalogToEnriched([
      { id: "", name: "bad" },
      { id: "a/b", name: "good", provider: "a" },
    ]);
    expect(enriched).toHaveLength(1);
    expect(enriched[0].id).toBe("a/b");

    const open = mapCatalogToOpenRouter([
      { id: "x/y", name: "Y", provider: "x", context_window: 4 },
    ]);
    expect(open[0].id).toBe("x/y");
  });
});

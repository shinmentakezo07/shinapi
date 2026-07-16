import { proxyToBackend } from "@/lib/api/proxy";

// Public model catalog — no auth. Backed by GET /api/models/catalog.
export async function GET(request: Request) {
  return proxyToBackend(request, "/api/models/catalog");
}

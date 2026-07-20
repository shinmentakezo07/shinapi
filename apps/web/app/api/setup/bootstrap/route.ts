import { proxyToBackend } from "@/lib/api/proxy";

// Public first-time bootstrap endpoint — backend gates on "no admin exists yet".
export async function POST(request: Request) {
  return proxyToBackend(request, "/api/setup/bootstrap");
}

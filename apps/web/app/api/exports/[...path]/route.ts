import { proxyToBackend } from "@/lib/api/proxy";
import { requireAuth } from "@/lib/api/require-auth";

function getSubPath(params: { path?: string[] }): string {
  return params.path?.length
    ? params.path.map(encodeURIComponent).join("/")
    : "";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const { path } = await params;
  const subPath = getSubPath({ path });
  return proxyToBackend(request, `/api/exports/${subPath}`);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const { path } = await params;
  const subPath = getSubPath({ path });
  return proxyToBackend(request, `/api/exports/${subPath}`);
}

import { proxyToBackend } from "@/lib/api/proxy";
import { requireAuth } from "@/lib/api/require-auth";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  const { id } = await params;
  return proxyToBackend(request, `/api/virtual-keys/${encodeURIComponent(id)}/deactivate`);
}

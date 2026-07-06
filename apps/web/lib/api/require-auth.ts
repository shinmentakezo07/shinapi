import { auth } from "@/auth";

/**
 * requireAuth checks for a NextAuth session. Returns a 401 Response if no
 * session exists AND no x-api-key header is present (API-key callers are
 * allowed through — the backend validates the key).
 */
export async function requireAuth(request: Request): Promise<Response | null> {
  const session = await auth();
  if (!session?.user) {
    // Allow API-key-only auth: if x-api-key is present, skip the 401.
    // The backend will validate the key.
    const apiKey = request.headers.get("x-api-key");
    if (apiKey) {
      return null;
    }
    return new Response(
      JSON.stringify({ success: false, error: "Authentication required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return null;
}

export async function requireAdmin(request: Request): Promise<Response | null> {
  const session = await auth();
  if (!session?.user) {
    return new Response(
      JSON.stringify({ success: false, error: "Authentication required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    return new Response(
      JSON.stringify({ success: false, error: "Admin access required" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return null;
}

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

// Cache the backend's needsSetup response in middleware memory. 10s lets
// post-bootstrap reloads resolve quickly without blowing the backend up
// on every page hit. The cache key is process-global so hot reloads in
// dev don't strand stale values.
const SETUP_CACHE_TTL_MS = 10_000;
const setupCacheSlot = globalThis as unknown as {
  __draSetupCache?: { value: boolean; ts: number };
};

async function fetchSetupStatus(): Promise<boolean> {
  const cached = setupCacheSlot.__draSetupCache;
  const now = Date.now();
  if (cached && now - cached.ts < SETUP_CACHE_TTL_MS) {
    return cached.value;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/setup/status`, {
      cache: "no-store",
      headers: { "x-internal-source": "setup-middleware" },
    });
    if (!res.ok) {
      // Backend not reachable or errored — fail open (no redirect).
      // Locking everybody out when the backend is down is worse UX.
      return false;
    }
    const json = (await res.json()) as { success?: boolean; data?: { needsSetup?: boolean } };
    const v = Boolean(json?.success && json?.data?.needsSetup === true);
    setupCacheSlot.__draSetupCache = { value: v, ts: now };
    return v;
  } catch {
    return false;
  }
}

export default auth(async (req: NextRequest & { auth: any }) => {
  const path = req.nextUrl.pathname;

  // ── Existing dashboard / login guards ──────────────────────────────
  const isLoggedIn = !!req.auth?.user;
  const isOnDashboard = path.startsWith("/dashboard");
  const isOnAuth =
    path.startsWith("/login") || path.startsWith("/signup");

  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
  if (isOnAuth && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }

  // ── First-time setup funnel ────────────────────────────────────────
  // If no admin exists yet, force every page (except /admin/setup
  // itself) to the bootstrap page. Once a setup has happened, the
  // /admin/setup itself bounces back to /admin/login.
  const isOnSetupPage =
    path === "/admin/setup" || path.startsWith("/admin/setup/");

  if (!isOnSetupPage) {
    const needsSetup = await fetchSetupStatus();
    if (needsSetup) {
      return Response.redirect(new URL("/admin/setup", req.nextUrl));
    }
  } else {
    const needsSetup = await fetchSetupStatus();
    if (!needsSetup) {
      return Response.redirect(new URL("/admin/login", req.nextUrl));
    }
  }

  return undefined;
});

export const config = {
  // Same matcher as before — exclude /api and Next internals so
  // /api/setup/* requests don't loop through the setup funnel.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

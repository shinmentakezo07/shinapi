import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import { authConfig } from "./auth.config";
import { z } from "zod";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const BACKEND_TOKEN_COOKIE = "dra_backend_token";

async function setBackendTokenCookie(token: string) {
  // Max-age matches the backend JWT expiry (7 days).
  const maxAge = 60 * 60 * 24 * 7;
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";
  const domain = process.env.BACKEND_TOKEN_COOKIE_DOMAIN || undefined;
  const cookieStore = await cookies();
  cookieStore.set(BACKEND_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: sameSite as "lax" | "none",
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  });
}

export async function clearBackendTokenCookie() {
  const secure = process.env.NODE_ENV === "production";
  const domain = process.env.BACKEND_TOKEN_COOKIE_DOMAIN || undefined;
  const cookieStore = await cookies();
  cookieStore.set(BACKEND_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure,
    path: "/",
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });
}

if (!secret) {
  throw new Error(
    "AUTH_SECRET or NEXTAUTH_SECRET environment variable is required",
  );
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (!payload.exp) return false;
    // Treat as expired if less than 60 seconds remaining
    return payload.exp < Math.floor(Date.now() / 1000) + 60;
  } catch {
    return true;
  }
}

async function backendLogin(email: string, password: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    let json: { success?: boolean; data?: unknown };
    try {
      json = (await res.json()) as { success?: boolean; data?: unknown };
    } catch {
      return null;
    }
    if (!json.success) return null;
    return json.data as {
      user: { id: string; name: string; email: string; role: string };
      token: string;
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  secret,
  providers: [
    GitHub,
    Google,
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const data = await backendLogin(email, password);
          if (data) {
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              backendToken: data.token,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account && account.provider !== "credentials") {
        return Boolean(user.email);
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.backendToken = user.backendToken;
        token.provider = account?.provider;
      }

      // Persist the backend JWT in a dedicated cookie so client-side SDK
      // requests can authenticate via cookie. We set it both on sign-in
      // (when user is present) and whenever the token is refreshed.
      if (
        token.backendToken &&
        (trigger === "signIn" || trigger === "signUp")
      ) {
        try {
          await setBackendTokenCookie(token.backendToken as string);
        } catch {
          // Cookie setting may fail in edge/runtime contexts; the
          // Authorization header fallback in proxyToBackend still works.
        }
      }

      if (token.backendToken && isTokenExpired(token.backendToken as string)) {
        // Attempt to refresh the token by calling the backend's /auth/me
        // endpoint with the existing token. If the backend still accepts it
        // (grace period), we keep it. Otherwise, clear the token so the user
        // is prompted to re-authenticate.
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5_000);
          const res = await fetch(`${BACKEND_URL}/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token.backendToken as string}`,
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (res.ok) {
            // Token still accepted by backend — keep it for now
          } else {
            token.backendToken = undefined;
          }
        } catch {
          // Network error or timeout — don't clear token on transient failures
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.backendToken = token.backendToken as string | undefined;
      }
      return session;
    },
  },
});

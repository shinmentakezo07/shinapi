"use server";

import { z } from "zod";
import { signIn, signOut, auth, clearBackendTokenCookie } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

/* ─────────────────────── /admin/setup bootstrap ─────────────────────── */
// IMPORTANT — `useActionState` invariants in Next.js 16 canary:
//
// 1. NEVER call `redirect()` from inside this action. Canary's action
//    protocol treats the redirect sentinel as an "unexpected response",
//    surfacing "An unexpected response was received from the server"
//    on the client. Use `SetupState.redirectTo` instead and let the
//    page perform the navigation in a useEffect.
// 2. NEVER call `revalidatePath()` from inside this action's success
//    return — same root cause as #1. The proxy.ts 2s TTL keeps the
//    needsSetup cache fresh enough on its own.
// 3. If signIn() ever throws a NEXT_REDIRECT sentinel (it must not with
//    redirect:false, but defensively), detect via `digest` and re-emit
//    a clean state instead of swallowing/re-throwing. Signed-in return
//    is always `{ success: true }`.

const BootstrapSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
    confirmPassword: z.string().min(6, { message: "Please confirm your password." }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetupState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string | null;
  /**
   * Set to `true` after a successful bootstrap so the client can render
   * a celebration state (confetti, success ring) BEFORE navigating to
   * `/admin/dashboard`. If the action redirected server-side we would
   * never get a chance to render the celebration — the browser would
   * navigate the moment the response arrived. By surfacing success and
   * letting the page decide when to push, we let the celebration play
   * for ~1.6 seconds.
   */
  success?: boolean;
  /**
   * Path the client should navigate to on the next render. Used instead
   * of calling `redirect()` from inside the action — `redirect()` from
   * a useActionState action in Next.js 16 canary can trip the
   * "An unexpected response was received from the server" runtime
   * error. The action stays purely result-typed and the page handles
   * navigation in a useEffect keyed off this field.
   */
  redirectTo?: string;
};

export async function bootstrapAdmin(
  _prev: SetupState | undefined,
  formData: FormData,
): Promise<SetupState> {
  const parsed = BootstrapSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted fields.",
    };
  }

  const { name, email, password } = parsed.data;

  let bootstrapOK = false;
  try {
    const res = await fetch(`${BACKEND_URL}/api/setup/bootstrap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ name, email, password }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!res.ok || !json.success) {
      // 403 → admin already exists (race or stale needsSetup cache).
      // Surface a typed redirectTo instead of calling redirect() — see
      // the module-level invariants at the top of this file for the
      // Next.js 16 canary reasoning.
      if (res.status === 403) {
        return { redirectTo: "/admin/login" };
      }
      return {
        message: json.error || `Bootstrap failed (HTTP ${res.status}).`,
      };
    }
    bootstrapOK = true;
  } catch {
    return { message: "Backend unreachable. Failed to create admin." };
  }

  if (!bootstrapOK) {
    // Defensive: should be unreachable but keeps the action result-typed.
    return { message: "Bootstrap did not complete. Please retry." };
  }

  // Auto-sign-in via the credentials provider. redirect:false means
  // signIn will not throw NEXT_REDIRECT — it returns the result we need.
  // Any failure here is treated as best-effort: the admin can still
  // navigate to /admin/login manually.
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (e) {
    if (isNextRedirectError(e)) {
      return { success: true };
    }
    // sign-in failure is non-fatal — surface success anyway so the
    // celebration plays and the user can retry login from the dashboard
    // prompt if AUTH_SECRET is mis-set in dev.
    return { success: true };
  }

  // Return a clean success signal. The proxy needsSetup cache TTL (2s)
  // is short enough that the post-celebration router.push already sees
  // fresh state — no revalidatePath() call here (running revalidatePath
  // inside a useActionState success return also trips Next.js 16
  // canary's "An unexpected response was received from the server"
  // error path).
  return { success: true };
}

// isNextRedirectError matches the Next.js internal "NEXT_REDIRECT" sentinel
// thrown by `redirect()` and `signIn(..., redirect: true)`. We re-throw those
// from any catch block inside the action so the runtime can complete the
// navigation; any other error is treated as a real failure.
function isNextRedirectError(e: unknown): boolean {
  if (e && typeof e === "object" && "digest" in e) {
    const digest = (e as { digest?: unknown }).digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      return true;
    }
  }
  if (e instanceof Error && e.message === "NEXT_REDIRECT") return true;
  return false;
}

const SignupSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." }),
});

export type State = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};

export async function signup(prevState: State, formData: FormData) {
  const validatedFields = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Account.",
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { message: json.error || "Failed to create account." };
    }
  } catch {
    return { message: "Backend unreachable. Failed to Create Account." };
  }

  // Sign in the user immediately after signup
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    // auto-login failed silently after signup
  }

  redirect("/dashboard");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      redirectTo: "/dashboard",
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function authenticateSocial(provider: string) {
  await signIn(provider, { redirectTo: "/dashboard" });
}

export async function authenticateAdmin(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      redirectTo: "/admin",
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid admin credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get("email");
  if (!email) return { message: "Email is required" };

  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    return { message: "Invalid email address" };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok && !json.success) {
      // Don't reveal if email exists for security
    }
  } catch {
    // Backend error handled silently to prevent email enumeration
  }

  return {
    message: "If an account exists, a password reset link has been sent.",
  };
}

export async function signOutAction() {
  "use server";
  try {
    await clearBackendTokenCookie();
  } catch {
    // Best-effort cleanup; the backend token cookie will expire naturally.
  }
  await signOut();
}

export async function updateProfile(prevState: any, formData: FormData) {
  const session = await auth();
  const backendToken = session?.user?.backendToken;
  if (!backendToken) {
    return { message: "Not authenticated with backend" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
  });

  const validated = schema.safeParse({ name, email });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify({ name, email }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { message: json.error || "Failed to update profile" };
    }
    revalidatePath("/dashboard/settings");
    revalidatePath("/", "layout");
    return { message: "Profile updated successfully" };
  } catch (e) {
    return { message: "Failed to update profile" };
  }
}

export async function changePassword(prevState: any, formData: FormData) {
  const session = await auth();
  const backendToken = session?.user?.backendToken;
  if (!backendToken) {
    return { message: "Not authenticated with backend" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return { message: "New passwords do not match" };
  }

  if (newPassword.length < 6) {
    return { message: "Password must be at least 6 characters" };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { message: json.error || "Failed to update password" };
    }
    return { message: "Password updated successfully" };
  } catch (e) {
    return { message: "Failed to update password" };
  }
}

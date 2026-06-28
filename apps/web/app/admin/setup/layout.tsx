import type { ReactNode } from "react";

// /admin/setup is intentionally a leaf layout. The (protected) group
// applies auth guards that block anonymous access — but bootstrap must
// be reachable when no admin exists yet, so we sidestep the (protected)
// group entirely and use the bootstrap middleware in proxy.ts instead.
//
// We deliberately do NOT redirect already-signed-in admins away from
// /admin/setup: if the first admin already exists and the user just got
// bounced into /admin/setup by a stale cache hit, hitting "back" or
// refreshing is the right escape hatch.
export default function AdminSetupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

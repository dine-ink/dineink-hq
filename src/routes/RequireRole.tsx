import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAppSelector } from "../store";

// Mirrors ProtectedRoute's shape but additionally checks the caller's role —
// used to gate the new finance/ops-sensitive dashboard pages (Cash Flow,
// Dues, Compliance, Equipment, Banking, Payroll processing) to OWNER/MANAGER,
// the first real role-based gate on this frontend (every other route today
// only checks that a token exists). ProtectedRoute still runs first via the
// route tree, so an unauthenticated user hits that redirect before this one.
export default function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const user = useAppSelector((s) => s.auth.user);

  if (!roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

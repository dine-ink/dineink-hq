import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAppSelector } from "../store";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAppSelector((s) => s.auth.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

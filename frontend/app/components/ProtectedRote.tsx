import { Navigate } from "react-router";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("auth_token") !== null;

  if (!isAuthenticated) {
    // Redirect to home and optionally open login modal
    return <Navigate to="/?openAuth=login" replace />;
  }

  return <>{children}</>;
}

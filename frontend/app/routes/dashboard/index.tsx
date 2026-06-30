import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import DashboardHome from "./student_home";

export default function DashboardIndex() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (user?.role === "instructor") {
    return <Navigate to="/dashboard/instructor" replace />;
  }

  return <DashboardHome />;
}

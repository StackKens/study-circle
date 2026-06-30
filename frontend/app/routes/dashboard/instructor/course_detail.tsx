import { useEffect, useState } from "react";
import { Link, useParams, NavLink, Outlet, Navigate, useLocation } from "react-router";
import {
  Megaphone,
  FolderOpen,
  ClipboardList,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Users,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  student_count: number;
  instructor_name: string;
}

const tabs = [
  { label: "Announcements", path: "announcements", icon: Megaphone },
  { label: "Resources", path: "resources", icon: FolderOpen },
  { label: "Assignments", path: "assignments", icon: ClipboardList },
  { label: "Discussions", path: "discussions", icon: MessageSquare },
];

export default function InstructorCourseDetailLayout() {
  const { courseId } = useParams();
  const location = useLocation();
  const { token } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!token || !courseId) return;
    fetch(`${API_URL}/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setCourse)
      .catch(console.error);
  }, [token, courseId]);

  if (!course) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-teal-600" size={24} />
      </div>
    );
  }

  const base = `/dashboard/instructor/courses/${courseId}`;

  if (courseId && location.pathname === base) {
    return <Navigate to={`${base}/announcements`} replace />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/dashboard/instructor/courses"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 mb-4"
      >
        <ArrowLeft size={14} /> Back to courses
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <h1 className="text-xl font-bold text-slate-900">{course.title}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
          {course.code && <span>{course.code}</span>}
          <span className="flex items-center gap-1">
            <Users size={12} /> {course.student_count} students
          </span>
        </div>
        {course.description && (
          <p className="text-sm text-slate-500 mt-3">{course.description}</p>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto mb-5 pb-1">
        {tabs.map((t) => (
          <NavLink
            key={t.path}
            to={`${base}/${t.path}`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-teal-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            <t.icon size={14} />
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ courseId, course }} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  Users,
  UserPlus,
  Megaphone,
  FileText,
  MessageSquare,
  ArrowRight,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
  student_count: number;
}

interface Activity {
  type: string;
  label: string;
  created_at: string;
  course_title: string;
}

interface DashboardData {
  courses: Course[];
  total_students: number;
  follower_count: number;
  recent_activity: Activity[];
}

const activityIcon: Record<string, typeof Megaphone> = {
  announcement: Megaphone,
  submission: FileText,
  discussion: MessageSquare,
};

export default function InstructorDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/instructors/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    );
  }

  const stats = [
    {
      label: "My Courses",
      value: data?.courses.length ?? 0,
      icon: BookOpen,
      color: "text-teal-600 bg-teal-50",
    },
    {
      label: "Total Students",
      value: data?.total_students ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Followers",
      value: data?.follower_count ?? 0,
      icon: UserPlus,
      color: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Instructor Portal
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Welcome, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1 hidden sm:block">
          Manage your courses, materials, and student engagement
        </p>
      </div>

      {/* KPI cards — horizontal compact row on mobile, 3-col grid on sm+ */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col"
          >
            {/* icon + value on one row on mobile */}
            <div className="flex items-center gap-2 sm:block">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 sm:mb-3 ${s.color}`}
              >
                <s.icon size={15} className="sm:hidden" />
                <s.icon size={18} className="hidden sm:block" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-slate-900 sm:mt-0">
                {s.value}
              </p>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        {/* My Courses */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">My Courses</h2>
            <Link
              to="/dashboard/instructor/courses"
              className="text-xs text-teal-600 font-medium flex items-center gap-1"
            >
              Manage all <ArrowRight size={12} />
            </Link>
          </div>
          {data?.courses.length ? (
            <div className="divide-y divide-slate-100">
              {data.courses.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  to={`/dashboard/instructor/courses/${c.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <GraduationCap size={15} className="text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {c.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.code || "No code"} · {c.student_count} students
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500 mb-3">No courses yet</p>
              <Link
                to="/dashboard/instructor/courses"
                className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-500"
              >
                Create your first course
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {data?.recent_activity.length ? (
            <div className="space-y-3">
              {data.recent_activity.map((a, i) => {
                const Icon = activityIcon[a.type] || FileText;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {a.label}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {a.course_title} ·{" "}
                        {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">
              Activity from students will appear here
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

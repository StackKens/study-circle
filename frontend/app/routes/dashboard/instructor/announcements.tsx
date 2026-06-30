import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Megaphone, Loader2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
}

export default function InstructorAnnouncementsHub() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCourses(d))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Announcements</h1>
      <p className="text-sm text-slate-500 mb-6">
        Post announcements to students in your courses
      </p>
      {loading ? (
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={24} />
      ) : courses.length === 0 ? (
        <p className="text-sm text-slate-500">
          <Link to="/dashboard/instructor/courses" className="text-teal-600">
            Create a course
          </Link>{" "}
          first to post announcements.
        </p>
      ) : (
        <div className="grid gap-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/dashboard/instructor/courses/${c.id}/announcements`}
              className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-200"
            >
              <Megaphone size={18} className="text-teal-600" />
              <div>
                <p className="font-medium text-slate-800">{c.title}</p>
                <p className="text-xs text-slate-400">{c.code || "No code"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

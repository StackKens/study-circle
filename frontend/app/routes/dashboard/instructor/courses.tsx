import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, GraduationCap, Users, Loader2, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  student_count: number;
  announcement_count: number;
  assignment_count: number;
}

export default function InstructorCoursesPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  function fetchCourses() {
    if (!token) return;
    fetch(`${API_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchCourses();
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, code, description }),
      });
      if (res.ok) {
        setShowCreate(false);
        setTitle("");
        setCode("");
        setDescription("");
        fetchCourses();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Courses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create and manage the courses you teach
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
        >
          <Plus size={16} /> New Course
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <form
            onSubmit={handleCreate}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Create Course</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Course code (e.g. CS101)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none resize-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              {creating ? "Creating…" : "Create Course"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-teal-600" size={24} />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <GraduationCap size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No courses yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Create a course to start sharing materials with students
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/dashboard/instructor/courses/${c.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-200 hover:shadow-sm transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                  <GraduationCap size={22} className="text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-teal-700">
                    {c.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.code || "No code"} · {c.student_count} students ·{" "}
                    {c.assignment_count} assignments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users size={14} /> {c.student_count}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

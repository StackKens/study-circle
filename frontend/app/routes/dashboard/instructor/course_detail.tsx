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
  Pencil,
  X,
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
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  function openEdit() {
    setEditError("");
    if (!course) return;
    setEditTitle(course.title);
    setEditCode(course.code ?? "");
    setEditDesc(course.description ?? "");
    setShowEdit(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    if (!token || !courseId || !editTitle.trim()) return;
    setEditing(true);
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          code: editCode || null,
          description: editDesc || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCourse((prev) => (prev ? { ...prev, ...updated } : prev));
        setShowEdit(false);
      } else {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        setEditError(err.error || "Something went wrong");
      }
    } catch {
      setEditError("Network error — could not reach server");
    } finally {
      setEditing(false);
    }
  }

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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
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
          <button
            onClick={openEdit}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
            title="Edit course"
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          />
          <form
            onSubmit={handleEdit}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Edit Course</h2>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Course title"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
            />
            <input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              placeholder="Course code (e.g. CS101)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
            />
            {editError && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{editError}</p>
            )}
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none resize-none"
            />
            <button
              type="submit"
              disabled={editing}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              {editing ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      )}

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

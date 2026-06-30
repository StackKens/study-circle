import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  FolderOpen,
  ArrowRight,
  Users,
  BookOpen,
  Upload,
  FileText,
  Link as LinkIcon,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
  student_count: number;
  resource_count: number;
}

export default function InstructorResourcesHub() {
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

  const totalResources = courses.reduce((s, c) => s + (c.resource_count ?? 0), 0);
  const totalStudents = courses.reduce((s, c) => s + (c.student_count ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Instructor Portal
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Resources</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload and manage lecture notes, PDFs, slides, and learning materials
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center mb-2">
            <FolderOpen size={15} className="text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalResources}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Resources</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
            <BookOpen size={15} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{courses.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Courses</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center mb-2">
            <Users size={15} className="text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Students</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/dashboard/instructor/courses"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-500 transition-colors"
          >
            <Upload size={15} /> Upload Resource
          </Link>
          <Link
            to="/dashboard/instructor/courses"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <FileText size={15} className="text-red-500" /> Add PDF / Slides
          </Link>
          <Link
            to="/dashboard/instructor/courses"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <LinkIcon size={15} className="text-blue-500" /> Share a Link
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Pick a course below to upload or manage its materials.
        </p>
      </div>

      {/* Supported types info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Lightbulb size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Supported resource types</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "PDF", color: "bg-red-50 text-red-600" },
                { label: "Document", color: "bg-teal-50 text-teal-600" },
                { label: "Slides", color: "bg-orange-50 text-orange-600" },
                { label: "Link", color: "bg-blue-50 text-blue-600" },
              ].map((t) => (
                <span key={t.label} className={`text-xs font-medium px-2 py-0.5 rounded-md ${t.color}`}>
                  {t.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              For videos, share a YouTube or Google Drive link using the "Link" type.
            </p>
          </div>
        </div>
      </div>

      {/* Course list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderOpen size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No courses yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Create a course first, then upload materials for your students.
          </p>
          <Link
            to="/dashboard/instructor/courses"
            className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-500"
          >
            Go to My Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Your Courses
          </p>
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/dashboard/instructor/courses/${c.id}/resources`}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                  <FolderOpen size={16} className="text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.code || "No code"} · {c.student_count} student{c.student_count !== 1 ? "s" : ""} · {c.resource_count} resource{c.resource_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="hidden sm:inline text-xs text-teal-600 font-medium group-hover:underline">
                  Manage
                </span>
                <ArrowRight size={15} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

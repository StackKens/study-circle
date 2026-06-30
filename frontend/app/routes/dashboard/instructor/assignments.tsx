import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ClipboardList,
  ArrowRight,
  Users,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
  student_count: number;
  assignment_count: number;
}

export default function InstructorAssignmentsHub() {
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

  const totalAssignments = courses.reduce((s, c) => s + (c.assignment_count ?? 0), 0);
  const totalStudents = courses.reduce((s, c) => s + (c.student_count ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Instructor Portal
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Assignments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create assignments and review student submissions across all your courses
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center mb-2">
            <ClipboardList size={15} className="text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalAssignments}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Assignments</p>
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
            <PlusCircle size={15} /> New Assignment
          </Link>
          <Link
            to="/dashboard/instructor/courses"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <CheckCircle2 size={15} className="text-teal-600" /> View Submissions
          </Link>
          <Link
            to="/dashboard/instructor/courses"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Clock size={15} className="text-amber-500" /> Manage Due Dates
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Select a course below to create or manage its assignments.
        </p>
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
          <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No courses yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Create a course first, then you can add assignments to it.
          </p>
          <Link
            to="/dashboard/instructor/courses"
            className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-500"
          >
            <PlusCircle size={14} /> Create a Course
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
              to={`/dashboard/instructor/courses/${c.id}/assignments`}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.code || "No code"} · {c.student_count} student{c.student_count !== 1 ? "s" : ""} · {c.assignment_count} assignment{c.assignment_count !== 1 ? "s" : ""}
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

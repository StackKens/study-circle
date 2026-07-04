import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  CheckCheck,
  ExternalLink,
  FileText,
  GraduationCap,
  Users,
  BookOpen,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
  student_name: string;
  student_email: string;
  assignment_title: string;
  due_date: string | null;
  course_id: string;
  course_title: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InstructorSubmissionsPage() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/instructors/me/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setSubmissions(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const totalSubmissions = submissions.length;
  const gradedCount = submissions.filter((s) => s.grade !== null).length;
  const ungradedCount = totalSubmissions - gradedCount;
  const uniqueStudents = new Set(submissions.map((s) => s.student_id)).size;
  const uniqueCourses = new Set(submissions.map((s) => s.course_id)).size;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <p className="text-[10px] sm:text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-0.5 sm:mb-1">
          Instructor Portal
        </p>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
          Submissions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Review all student submissions across your courses
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2">
            <CheckCheck size={13} className="text-emerald-600 sm:size-[15px]" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">
            {totalSubmissions}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-50 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2">
            <CheckCheck size={13} className="text-teal-600 sm:size-[15px]" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">{gradedCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Graded</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2">
            <FileText size={13} className="text-amber-600 sm:size-[15px]" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">{ungradedCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Needs Review</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2">
            <Users size={13} className="text-blue-600 sm:size-[15px]" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">{uniqueStudents}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
            {uniqueCourses} {(uniqueCourses === 1 ? "course" : "courses")}
          </p>
        </div>
      </div>

      {/* Submissions list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 size={20} className="animate-spin text-teal-600 sm:size-6" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <CheckCheck size={28} className="text-slate-300 mx-auto mb-2 sm:size-9 sm:mb-3" />
          <p className="text-sm sm:text-base text-slate-600 font-medium">No submissions yet</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-3 sm:mb-4">
            Student submissions will appear here once they start submitting
            assignments.
          </p>
          <Link
            to="/dashboard/instructor/assignments"
            className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-teal-500"
          >
            <FileText size={12} className="sm:size-[14px]" /> Go to Assignments
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-teal-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {s.student_name}
                    </span>
                    <span className="hidden sm:inline text-[10px] sm:text-xs text-slate-400">
                      · {s.student_email}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 leading-tight sm:leading-normal">
                    <span className="font-medium text-slate-700 truncate max-w-[200px] sm:max-w-none">
                      {s.assignment_title}
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <Link
                      to={`/dashboard/instructor/courses/${s.course_id}`}
                      className="text-teal-600 hover:underline"
                    >
                      {s.course_title}
                    </Link>
                    <span className="hidden sm:inline">·</span>
                    <span className="text-[10px] sm:text-xs">
                      {formatDate(s.submitted_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                    {s.grade !== null ? (
                      <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        {s.grade}/100
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                        Needs Review
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/dashboard/instructor/courses/${s.course_id}/assignments`}
                  className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-teal-600 font-medium hover:underline shrink-0 mt-0.5 sm:mt-0"
                >
                  Review <ChevronRight size={10} className="sm:size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

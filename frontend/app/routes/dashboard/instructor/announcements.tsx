import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Megaphone,
  ArrowRight,
  Users,
  BookOpen,
  ChevronRight,
  X,
  Bell,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
  student_count: number;
  announcement_count: number;
}

type Step = "course" | "form";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-colors";

export default function InstructorAnnouncementsHub() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // post flow
  const [step, setStep] = useState<Step | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function loadCourses() {
    fetch(`${API_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCourses(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCourses();
  }, [token]);

  const totalAnnouncements = courses.reduce(
    (s, c) => s + (c.announcement_count ?? 0),
    0,
  );
  const totalStudents = courses.reduce((s, c) => s + (c.student_count ?? 0), 0);

  function startPost() {
    setStep("course");
    setSelectedCourse(null);
    setTitle("");
    setContent("");
    setError("");
    setSuccess("");
  }

  function pickCourse(c: Course) {
    setSelectedCourse(c);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/courses/${selectedCourse.id}/announcements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");
      setStep(null);
      setSuccess(`Announcement posted to "${selectedCourse.title}"`);
      loadCourses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Instructor Portal
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Announcements
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Post updates, reminders, and notices to your enrolled students
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            icon: Megaphone,
            value: totalAnnouncements,
            label: "Total Posted",
            color: "bg-teal-50 text-teal-600",
          },
          {
            icon: BookOpen,
            value: courses.length,
            label: "Courses",
            color: "bg-blue-50 text-blue-600",
          },
          {
            icon: Users,
            value: totalStudents,
            label: "Total Students",
            color: "bg-violet-50 text-violet-600",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${k.color}`}
            >
              <k.icon size={15} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Enrolled-only note */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Bell size={15} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700 leading-relaxed">
          <span className="font-semibold">
            Announcements go only to enrolled students.
          </span>{" "}
          Students who haven't enrolled in the course will not see them. Each
          announcement is tied to one specific course.
        </p>
      </div>

      {/* Success toast */}
      {success && (
        <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <Megaphone size={14} /> {success}
        </div>
      )}

      {/* Post button */}
      {!step && (
        <button
          onClick={startPost}
          disabled={courses.length === 0}
          className="mb-6 flex items-center cursor-pointer gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Megaphone size={16} /> Post Announcement
        </button>
      )}

      {/* ── Step 1: pick course ── */}
      {step === "course" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">
              Step 1 — Pick a course
            </p>
            <button
              onClick={() => setStep(null)}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Which course is this announcement for? Only enrolled students will
            see it.
          </p>
          <div className="space-y-2">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => pickCourse(c)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {c.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.code || "No code"} · {c.student_count} student
                    {c.student_count !== 1 ? "s" : ""} · {c.announcement_count}{" "}
                    announcement{c.announcement_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-300 group-hover:text-teal-500 transition-colors shrink-0"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: write announcement ── */}
      {step === "form" && selectedCourse && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-sm">
              <button
                onClick={() => setStep("course")}
                className="text-slate-400 hover:text-teal-600 cursor-pointer"
              >
                Course
              </button>
              <ChevronRight size={13} className="text-slate-300" />
              <span className="font-semibold text-slate-900">
                Step 2 — Write announcement
              </span>
            </div>
            <button
              onClick={() => setStep(null)}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          {/* course badge */}
          <div className="mt-2 mb-4">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-700">
              {selectedCourse.title}
            </span>
            <span className="text-xs text-slate-400 ml-2">
              · {selectedCourse.student_count} enrolled student
              {selectedCourse.student_count !== 1 ? "s" : ""} will be notified
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Assignment 2 deadline extended"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                placeholder="Write your message to students…"
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting ? "Posting…" : "Post Announcement"}
              </button>
              <button
                type="button"
                onClick={() => setStep(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Course list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-slate-100 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Megaphone size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No courses yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Create a course to start posting announcements to your students.
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
            Browse by course
          </p>
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/dashboard/instructor/courses/${c.id}/announcements`}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                  <Megaphone size={16} className="text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {c.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.code || "No code"} · {c.student_count} student
                    {c.student_count !== 1 ? "s" : ""} · {c.announcement_count}{" "}
                    announcement{c.announcement_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ArrowRight
                size={15}
                className="text-slate-400 group-hover:text-teal-600 transition-colors shrink-0 ml-3"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

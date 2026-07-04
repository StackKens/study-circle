import { useState } from "react";
import { Link } from "react-router";
import {
  GraduationCap,
  Loader2,
  Users,
  BookOpen,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { usePrivateChat } from "../../context/PrivateChatContext";
import { UserAvatar } from "../../components/UserAvatar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  instructor_name: string;
  instructor_avatar: string | null;
  instructor_id?: string;
  department: string;
  student_count: number;
  is_enrolled: boolean;
}

export default function StudentCoursesPage() {
  const { token, user } = useAuth();
  const { openChat } = usePrivateChat();
  const queryClient = useQueryClient();
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const { data: courses = [], isLoading: loading } = useQuery<Course[]>({
    queryKey: ["courses-available", user?.id],
    queryFn: () =>
      fetch(`${API_URL}/courses/available`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    enabled: !!token,
  });

  async function handleEnroll(courseId: string) {
    setEnrollingId(courseId);
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) queryClient.invalidateQueries({ queryKey: ["courses-available", user?.id] });
    } finally {
      setEnrollingId(null);
    }
  }

  if (user?.role === "instructor") {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-slate-600">Course enrollment is for students.</p>
        <Link
          to="/dashboard/instructor/courses"
          className="text-teal-600 text-sm font-semibold mt-2 inline-block"
        >
          Go to My Courses →
        </Link>
      </div>
    );
  }

  const enrolled = courses.filter((c) => c.is_enrolled);
  const available = courses.filter((c) => !c.is_enrolled);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Learning
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
        <p className="text-slate-500 text-sm mt-1">
          Enroll in instructor-led courses and access materials
        </p>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={28} />
      ) : (
        <div className="space-y-8">
          {enrolled.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-teal-600" /> My Enrolled
                Courses
              </h2>
              <div className="grid gap-3">
                {enrolled.map((c) => (
                  <Link
                    key={c.id}
                    to={`/dashboard/courses/${c.id}`}
                    className="bg-white rounded-xl border border-teal-200 p-5 hover:shadow-sm transition-all flex items-center justify-between group"
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
                          {c.instructor_name} · {c.code || "No code"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-teal-600 font-semibold">
                      Open →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <GraduationCap size={16} /> Browse Courses
            </h2>
            {available.length === 0 && enrolled.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <GraduationCap
                  size={40}
                  className="text-slate-300 mx-auto mb-3"
                />
                <p className="text-slate-600">No courses available yet</p>
                <Link
                  to="/dashboard/instructors"
                  className="text-teal-600 text-sm font-semibold mt-3 inline-block"
                >
                  Follow instructors →
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {available.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <UserAvatar
                        userId={c.instructor_id || c.instructor_name}
                        name={c.instructor_name}
                        avatarUrl={c.instructor_avatar}
                        size="lg"
                        onClick={() =>
                          openChat({
                            id: c.instructor_id || "",
                            name: c.instructor_name,
                            avatar_url: c.instructor_avatar,
                          })
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">
                          {c.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {c.instructor_name} · {c.department} ·{" "}
                          {c.student_count} students
                        </p>
                        {c.description && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                            {c.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEnroll(c.id)}
                            disabled={enrollingId === c.id}
                            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
                          >
                            {enrollingId === c.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : null}
                            Enroll
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface StudentAssignment {
  id: string;
  course_id: string;
  course_title: string;
  course_code: string;
  title: string;
  description: string;
  due_date: string;
  file_url: string;
  submitted: boolean;
  grade: number | null;
  feedback: string;
  strengths: string;
  weaknesses: string;
  graded_at: string;
  created_at: string;
}

function parseList(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export default function StudentAssignments() {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [submitContent, setSubmitContent] = useState<Record<string, string>>({});
  const [submitUrl, setSubmitUrl] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/students/me/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load assignments");
        return r.json();
      })
      .then((data) => {
        setAssignments(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const grouped = assignments.reduce(
    (acc, a) => {
      if (!acc[a.course_id]) acc[a.course_id] = { title: a.course_title, code: a.course_code, items: [] };
      acc[a.course_id].items.push(a);
      return acc;
    },
    {} as Record<string, { title: string; code: string; items: StudentAssignment[] }>,
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  async function handleSubmit(assignmentId: string) {
    if (!token) return;
    setSubmittingId(assignmentId);
    try {
      const res = await fetch(`${API_URL}/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: submitContent[assignmentId] || "",
          url: submitUrl[assignmentId] || "",
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitContent((prev) => ({ ...prev, [assignmentId]: "" }));
      setSubmitUrl((prev) => ({ ...prev, [assignmentId]: "" }));
      const r = await fetch(`${API_URL}/students/me/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (Array.isArray(data)) setAssignments(data);
    } catch (e: any) {
      alert(e.message || "Failed to submit");
    } finally {
      setSubmittingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-sm text-red-500">{error}</div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Assignments</h1>
        <p className="text-sm text-slate-400 text-center py-12">
          No assignments yet
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-6">My Assignments</h1>

      {Object.entries(grouped).map(([courseId, group]) => (
        <div key={courseId} className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            {group.title}
            {group.code && (
              <span className="text-xs text-slate-400 font-normal">
                ({group.code})
              </span>
            )}
          </h2>

          <div className="space-y-2">
            {group.items.map((a) => {
              const open = expanded[a.id];
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(a.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {a.title}
                        </p>
                        {a.submitted && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                            Submitted
                          </span>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {a.description}
                        </p>
                      )}
                      {a.due_date && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Due {new Date(a.due_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.grade != null && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            a.grade >= 70
                              ? "text-emerald-600 bg-emerald-50"
                              : a.grade >= 40
                                ? "text-amber-600 bg-amber-50"
                                : "text-red-600 bg-red-50"
                          }`}
                        >
                          {a.grade}/100
                        </span>
                      )}
                      {open ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                      {a.description && (
                        <p className="text-sm text-slate-600 mb-3">
                          {a.description}
                        </p>
                      )}

                      {a.file_url && (
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg mb-3"
                        >
                          <FileText size={14} />
                          Attached file
                          <ExternalLink size={12} />
                        </a>
                      )}

                      {a.grade != null && a.feedback && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 mb-1">
                            Feedback
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {a.feedback}
                          </p>
                          {(() => {
                            const strengths = parseList(a.strengths);
                            const weaknesses = parseList(a.weaknesses);
                            return (
                              <div className="mt-2 space-y-1.5">
                                {strengths.length > 0 && (
                                  <div>
                                    <p className="text-[11px] font-medium text-emerald-600">
                                      Strengths
                                    </p>
                                    <ul className="list-disc list-inside text-[11px] text-slate-500">
                                      {strengths.map((s, i) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {weaknesses.length > 0 && (
                                  <div>
                                    <p className="text-[11px] font-medium text-amber-600">
                                      Areas to Improve
                                    </p>
                                    <ul className="list-disc list-inside text-[11px] text-slate-500">
                                      {weaknesses.map((w, i) => (
                                        <li key={i}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {!a.submitted && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={submitContent[a.id] || ""}
                            onChange={(e) =>
                              setSubmitContent((prev) => ({
                                ...prev,
                                [a.id]: e.target.value,
                              }))
                            }
                            placeholder="Your answer or notes…"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none"
                          />
                          <input
                            value={submitUrl[a.id] || ""}
                            onChange={(e) =>
                              setSubmitUrl((prev) => ({
                                ...prev,
                                [a.id]: e.target.value,
                              }))
                            }
                            placeholder="Link to file (optional)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
                          />
                          <button
                            onClick={() => handleSubmit(a.id)}
                            disabled={submittingId === a.id}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                          >
                            {submittingId === a.id
                              ? "Submitting…"
                              : "Submit"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { ClipboardList, Plus, Loader2, ChevronDown, ChevronUp, Sparkles, X, ExternalLink } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function parseList(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  submission_count: number;
}

interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  content: string | null;
  url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  strengths: string | null;
  weaknesses: string | null;
  graded_at: string | null;
}

export default function CourseAssignmentsPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);

  function load() {
    fetch(`${API_URL}/courses/${courseId}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId, token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/courses/${courseId}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        due_date: dueDate || null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      load();
    }
  }

  async function toggleSubmissions(assignmentId: string) {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);
    const res = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setSubmissions(data);
  }

  async function handleGrade(submission: Submission, assignment: Assignment) {
    setGradingId(submission.id);
    try {
      const res = await fetch(
        `${API_URL}/assignments/${expandedId}/grade/${submission.student_id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const updated = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submission.id ? { ...s, ...updated } : s)),
        );
      }
    } finally {
      setGradingId(null);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-slate-900">Assignments</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none"
          />
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
          />
          <button
            type="submit"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Create Assignment
          </button>
        </form>
      )}

      {loading ? (
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={24} />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <ClipboardList size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-4">
                <p className="font-semibold text-slate-900">{a.title}</p>
                {a.description && (
                  <p className="text-sm text-slate-500 mt-1">{a.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-400">
                    {a.due_date
                      ? `Due ${new Date(a.due_date).toLocaleString()}`
                      : "No due date"}{" "}
                    · {a.submission_count} submissions
                  </p>
                  <button
                    onClick={() => toggleSubmissions(a.id)}
                    className="flex items-center gap-1 text-xs text-teal-600 font-medium cursor-pointer"
                  >
                    View submissions{" "}
                    {expandedId === a.id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>
              </div>
              {expandedId === a.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-2">
                  {submissions.length === 0 ? (
                    <p className="text-xs text-slate-400">No submissions yet</p>
                  ) : (
                    submissions.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">
                              {s.student_name}
                            </p>
                            {(s.content || s.url) && (
                              <button
                                onClick={() => setViewSubmission(s)}
                                className="text-xs text-teal-600 font-medium mt-1 inline-flex items-center gap-1 cursor-pointer hover:underline"
                              >
                                <ExternalLink size={12} />
                                View submission
                              </button>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 ml-3">
                            {s.grade !== null && (
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  s.grade >= 70
                                    ? "text-emerald-600 bg-emerald-50"
                                    : s.grade >= 40
                                      ? "text-amber-600 bg-amber-50"
                                      : "text-red-600 bg-red-50"
                                }`}
                              >
                                {s.grade}/100
                              </span>
                            )}
                            {s.grade === null && (
                              <button
                                onClick={() => handleGrade(s, a)}
                                disabled={gradingId === s.id}
                                className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2.5 py-1 rounded-lg font-medium cursor-pointer disabled:opacity-50"
                              >
                                {gradingId === s.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                                {gradingId === s.id ? "Grading…" : "Grade with AI"}
                              </button>
                            )}
                          </div>
                        </div>
                        {s.feedback && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {s.feedback}
                            </p>
                            {(() => {
                              const st = parseList(s.strengths);
                              const wk = parseList(s.weaknesses);
                              return (
                                <div className="mt-2 flex gap-4">
                                  {st.length > 0 && (
                                    <div className="flex-1">
                                      <p className="text-[11px] font-medium text-emerald-600">Strengths</p>
                                      <ul className="list-disc list-inside text-[11px] text-slate-400">
                                        {st.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {wk.length > 0 && (
                                    <div className="flex-1">
                                      <p className="text-[11px] font-medium text-amber-600">To Improve</p>
                                      <ul className="list-disc list-inside text-[11px] text-slate-400">
                                        {wk.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {viewSubmission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setViewSubmission(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <p className="font-semibold text-slate-900 text-sm">
                {viewSubmission.student_name}'s Submission
              </p>
              <button
                onClick={() => setViewSubmission(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {viewSubmission.content && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Written Response
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {viewSubmission.content}
                  </p>
                </div>
              )}
              {viewSubmission.url && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Attached File
                  </p>
                  <a
                    href={viewSubmission.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:underline"
                  >
                    <ExternalLink size={14} />
                    Open attached file
                  </a>
                </div>
              )}
              {viewSubmission.grade !== null && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Grade
                  </p>
                  <span
                    className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                      viewSubmission.grade >= 70
                        ? "text-emerald-600 bg-emerald-50"
                        : viewSubmission.grade >= 40
                          ? "text-amber-600 bg-amber-50"
                          : "text-red-600 bg-red-50"
                    }`}
                  >
                    {viewSubmission.grade}/100
                  </span>
                  {viewSubmission.feedback && (
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      {viewSubmission.feedback}
                    </p>
                  )}
                  {(() => {
                    const st = parseList(viewSubmission.strengths);
                    const wk = parseList(viewSubmission.weaknesses);
                    return (
                      <div className="mt-3 space-y-2">
                        {st.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-emerald-600">Strengths</p>
                            <ul className="list-disc list-inside text-xs text-slate-500 mt-0.5 space-y-0.5">
                              {st.map((item: string, i: number) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                        {wk.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-amber-600">Areas to Improve</p>
                            <ul className="list-disc list-inside text-xs text-slate-500 mt-0.5 space-y-0.5">
                              {wk.map((item: string, i: number) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

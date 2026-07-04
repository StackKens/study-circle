import { useEffect, useState } from "react";
import { ClipboardList, Loader2, ChevronDown, ChevronUp, Sparkles, X, ExternalLink, BookOpen, Users, FileText } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { uploadToCloudinary } from "../../../utils/cloudinary";

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
  file_url: string | null;
  submission_count: number;
  course_id: string;
  course_title: string;
}

interface Course {
  id: string;
  title: string;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function InstructorAssignmentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newCourse, setNewCourse] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [manualGradeId, setManualGradeId] = useState<string | null>(null);
  const [manualScore, setManualScore] = useState("");
  const [manualFeedback, setManualFeedback] = useState("");
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);

  function load() {
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/instructors/me/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([assignments, coursesData]) => {
        if (Array.isArray(assignments)) setItems(assignments);
        if (Array.isArray(coursesData)) setCourses(coursesData);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourse || !newTitle.trim()) return;
    setCreating(true);
    try {
      let fileUrl = "";
      if (newFile) {
        setUploading(true);
        fileUrl = await uploadToCloudinary(newFile);
      }
      const res = await fetch(`${API_URL}/instructors/me/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: newCourse, title: newTitle, description: newDesc, due_date: newDue || null, file_url: fileUrl || null }),
      });
      if (res.ok) {
        setShowNew(false);
        setNewCourse("");
        setNewTitle("");
        setNewDesc("");
        setNewDue("");
        setNewFile(null);
        load();
      }
    } finally {
      setUploading(false);
      setCreating(false);
    }
  }

  async function toggleSubmissions(assignmentId: string) {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);
    setLoadingSubs(true);
    const res = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setSubmissions(data);
    setLoadingSubs(false);
  }

  async function handleGrade(assignmentId: string, studentId: string) {
    setGradingId(studentId);
    try {
      const res = await fetch(`${API_URL}/assignments/${assignmentId}/grade/${studentId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.student_id === studentId ? { ...s, ...updated } : s)),
        );
      }
    } finally {
      setGradingId(null);
    }
  }

  function openManualGrade(sub: Submission) {
    setManualGradeId(sub.student_id);
    setManualScore(sub.grade != null ? String(sub.grade) : "");
    setManualFeedback(sub.feedback || "");
  }

  function closeManualGrade() {
    setManualGradeId(null);
    setManualScore("");
    setManualFeedback("");
  }

  async function handleManualGrade(assignmentId: string, studentId: string) {
    setGradingId(studentId);
    try {
      const res = await fetch(`${API_URL}/assignments/${assignmentId}/grade/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ grade: Number(manualScore), feedback: manualFeedback }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.student_id === studentId ? { ...s, ...updated } : s)),
        );
        closeManualGrade();
      }
    } finally {
      setGradingId(null);
    }
  }

  const totalAssignments = items.length;
  const totalSubmissions = items.reduce((s, a) => s + a.submission_count, 0);
  const uniqueCourses = new Set(items.map((a) => a.course_id)).size;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
            Instructor Portal
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create assignments and review submissions across your courses
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="shrink-0 whitespace-nowrap bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
        >
          New Assignment
        </button>
      </div>

      {/* New Assignment Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <form
            onSubmit={handleCreate}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">New Assignment</h2>
              <button type="button" onClick={() => setShowNew(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <select
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none bg-white"
            >
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Assignment title"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Instructions"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none resize-none"
            />
            <input
              type="datetime-local"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
            />
            <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 cursor-pointer hover:border-teal-400 transition-colors">
              <FileText size={16} className="shrink-0" />
              <span className="flex-1">{newFile ? newFile.name : "Attach a file (optional)"}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <button
              type="submit"
              disabled={creating || uploading}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              {uploading ? "Uploading…" : creating ? "Creating…" : "Create Assignment"}
            </button>
          </form>
        </div>
      )}

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
          <p className="text-2xl font-bold text-slate-900">{uniqueCourses}</p>
          <p className="text-xs text-slate-500 mt-0.5">Courses</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center mb-2">
            <Users size={15} className="text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalSubmissions}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Submissions</p>
        </div>
      </div>

      {/* Assignment list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No assignments yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Create assignments for your courses here.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-500 cursor-pointer"
          >
            New Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                      <span className="text-teal-600">{a.course_title}</span>
                      <span>·</span>
                      <span>{a.submission_count} submission{a.submission_count !== 1 ? "s" : ""}</span>
                      {a.due_date && (
                        <>
                          <span>·</span>
                          <span>Due {formatDate(a.due_date)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {a.description && (
                  <p className="text-sm text-slate-500 mt-2">{a.description}</p>
                )}
                {a.file_url && (
                  <a
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-medium mt-2 hover:underline"
                  >
                    <FileText size={13} />
                    View attached file
                  </a>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => toggleSubmissions(a.id)}
                    className="flex items-center gap-1 text-xs text-teal-600 font-medium cursor-pointer"
                  >
                    View submissions
                    {expandedId === a.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>
              {expandedId === a.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-2">
                  {loadingSubs ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={18} className="animate-spin text-teal-600" />
                    </div>
                  ) : submissions.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No submissions yet</p>
                  ) : (
                    submissions.map((s) => (
                      <div key={s.id} className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{s.student_name}</p>
                            <p className="text-[11px] text-slate-400">
                              Submitted {formatDate(s.submitted_at)}
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
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {s.grade != null && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                s.grade >= 70 ? "text-emerald-600 bg-emerald-50" : s.grade >= 40 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50"
                              }`}>
                                {s.grade}/100
                              </span>
                            )}
                            {manualGradeId === s.student_id ? (
                              <div className="flex flex-col items-end gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={manualScore}
                                  onChange={(e) => setManualScore(e.target.value)}
                                  placeholder="Score (0-100)"
                                  className="w-24 px-2 py-1 rounded border border-slate-200 text-xs outline-none"
                                />
                                <textarea
                                  value={manualFeedback}
                                  onChange={(e) => setManualFeedback(e.target.value)}
                                  placeholder="Feedback"
                                  rows={2}
                                  className="w-48 px-2 py-1 rounded border border-slate-200 text-xs outline-none resize-none"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleManualGrade(a.id, s.student_id)}
                                    disabled={gradingId === s.student_id || !manualScore}
                                    className="text-xs bg-teal-600 text-white px-2 py-1 rounded-lg font-medium cursor-pointer disabled:opacity-50"
                                  >
                                    {gradingId === s.student_id ? "Saving…" : "Save"}
                                  </button>
                                  <button
                                    onClick={closeManualGrade}
                                    className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-medium cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleGrade(a.id, s.student_id)}
                                  disabled={gradingId === s.student_id}
                                  className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2.5 py-1 rounded-lg font-medium cursor-pointer disabled:opacity-50"
                                >
                                  {gradingId === s.student_id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Sparkles size={12} />
                                  )}
                                  {gradingId === s.student_id ? "Grading…" : "Grade with AI"}
                                </button>
                                <button
                                  onClick={() => openManualGrade(s)}
                                  className="text-xs bg-slate-600 text-white px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                                >
                                  Grade Manually
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {s.feedback && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 leading-relaxed">{s.feedback}</p>
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

      {/* View submission modal */}
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
              <button onClick={() => setViewSubmission(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {viewSubmission.content && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Written Response</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{viewSubmission.content}</p>
                </div>
              )}
              {viewSubmission.url && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Attached File</p>
                  <a href={viewSubmission.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:underline">
                    <ExternalLink size={14} /> Open attached file
                  </a>
                </div>
              )}
              {viewSubmission.grade !== null && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Grade</p>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    viewSubmission.grade >= 70 ? "text-emerald-600 bg-emerald-50" : viewSubmission.grade >= 40 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50"
                  }`}>
                    {viewSubmission.grade}/100
                  </span>
                  {viewSubmission.feedback && (
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{viewSubmission.feedback}</p>
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

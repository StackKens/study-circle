import { useEffect, useState, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router";

function parseList(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}
import {
  ArrowLeft,
  Megaphone,
  FolderOpen,
  ClipboardList,
  MessageSquare,
  Loader2,
  ExternalLink,
  Send,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AiCourseChat from "../../components/AiCourseChat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

type Tab = "announcements" | "resources" | "assignments" | "discussions";

interface Course {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  instructor_name: string;
}

export default function StudentCourseDetailPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [tab, setTab] = useState<Tab>("announcements");
  const [loading, setLoading] = useState(true);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);

  const [submitContent, setSubmitContent] = useState("");
  const [submitUrl, setSubmitUrl] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContent, setNewDiscussionContent] = useState("");
  const [expandedDiscussion, setExpandedDiscussion] = useState<string | null>(
    null,
  );
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [replyText, setReplyText] = useState("");
  const assignmentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!token || !courseId) return;
    fetch(`${API_URL}/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setCourse)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, courseId]);

  useEffect(() => {
    if (!token || !courseId) return;
    const headers = { Authorization: `Bearer ${token}` };
    if (tab === "announcements") {
      fetch(`${API_URL}/courses/${courseId}/announcements`, { headers })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setAnnouncements(d));
    } else if (tab === "resources") {
      fetch(`${API_URL}/courses/${courseId}/resources`, { headers })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setResources(d));
    } else if (tab === "assignments") {
      fetch(`${API_URL}/courses/${courseId}/assignments`, { headers })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setAssignments(d));
    } else {
      fetch(`${API_URL}/courses/${courseId}/discussions`, { headers })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setDiscussions(d));
    }
  }, [tab, token, courseId]);

  useEffect(() => {
    const targetId = searchParams.get("assignment");
    if (targetId) {
      setTab("assignments");
    }
  }, [searchParams]);

  useEffect(() => {
    const targetId = searchParams.get("assignment");
    if (targetId && assignments.length > 0) {
      const el = assignmentRefs.current[targetId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [assignments, searchParams]);

  async function handleSubmit(assignmentId: string) {
    setSubmittingId(assignmentId);
    try {
      await fetch(`${API_URL}/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: submitContent, url: submitUrl }),
      });
      setSubmitContent("");
      setSubmitUrl("");
      const res = await fetch(`${API_URL}/courses/${courseId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setAssignments(data);
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleCreateDiscussion(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/courses/${courseId}/discussions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newDiscussionTitle,
        content: newDiscussionContent,
      }),
    });
    if (res.ok) {
      setNewDiscussionTitle("");
      setNewDiscussionContent("");
      const list = await fetch(`${API_URL}/courses/${courseId}/discussions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDiscussions(await list.json());
    }
  }

  async function loadReplies(discussionId: string) {
    setExpandedDiscussion(discussionId);
    const res = await fetch(`${API_URL}/discussions/${discussionId}/replies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      setReplies((prev) => ({ ...prev, [discussionId]: data }));
    }
  }

  async function handleReply(discussionId: string) {
    if (!replyText.trim()) return;
    await fetch(`${API_URL}/discussions/${discussionId}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: replyText }),
    });
    setReplyText("");
    loadReplies(discussionId);
  }

  const tabs: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "resources", label: "Resources", icon: FolderOpen },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
  ];

  if (loading || !course) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/dashboard/courses"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 mb-4"
      >
        <ArrowLeft size={14} /> Back to courses
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <h1 className="text-xl font-bold text-slate-900">{course.title}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {course.instructor_name} · {course.code || "No code"}
        </p>
        {course.description && (
          <p className="text-sm text-slate-500 mt-3">{course.description}</p>
        )}
      </div>

      {courseId && <AiCourseChat courseId={courseId} />}

      <div className="flex gap-1 overflow-x-auto mb-5 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
              tab === t.id
                ? "bg-teal-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {tab === "announcements" &&
          (announcements.length ? (
            announcements.map((a) => (
              <div key={a.id} className="py-4 border-b border-slate-100 last:border-0">
                <p className="font-semibold text-slate-900">{a.title}</p>
                <p className="text-sm text-slate-600 mt-2">{a.content}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              No announcements yet
            </p>
          ))}

        {tab === "resources" &&
          (resources.length ? (
            resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:text-teal-600"
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">{r.title}</p>
                  <p className="text-xs text-slate-400 capitalize">{r.type}</p>
                </div>
                <ExternalLink size={14} />
              </a>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              No resources yet
            </p>
          ))}

        {tab === "assignments" &&
          (assignments.length ? (
            assignments.map((a) => (
              <div
                key={a.id}
                id={`assignment-${a.id}`}
                ref={(el) => { assignmentRefs.current[a.id] = el; }}
                className="py-4 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    {a.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {a.description}
                      </p>
                    )}
                    {a.due_date && (
                      <p className="text-xs text-slate-400 mt-1">
                        Due {new Date(a.due_date).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {a.submitted && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                        Submitted
                      </span>
                    )}
                    {a.grade != null && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
                {a.grade != null && a.feedback && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Feedback</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{a.feedback}</p>
                    {(() => {
                      const strengths = parseList(a.strengths);
                      const weaknesses = parseList(a.weaknesses);
                      return (
                        <div className="mt-2 space-y-1.5">
                          {strengths.length > 0 && (
                            <div>
                              <p className="text-[11px] font-medium text-emerald-600">Strengths</p>
                              <ul className="list-disc list-inside text-[11px] text-slate-500">
                                {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}
                          {weaknesses.length > 0 && (
                            <div>
                              <p className="text-[11px] font-medium text-amber-600">Areas to Improve</p>
                              <ul className="list-disc list-inside text-[11px] text-slate-500">
                                {weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
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
                      value={submitContent}
                      onChange={(e) => setSubmitContent(e.target.value)}
                      placeholder="Your answer or notes…"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none"
                    />
                    <input
                      value={submitUrl}
                      onChange={(e) => setSubmitUrl(e.target.value)}
                      placeholder="Link to file (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
                    />
                    <button
                      onClick={() => handleSubmit(a.id)}
                      disabled={submittingId === a.id}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {submittingId === a.id ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              No assignments yet
            </p>
          ))}

        {tab === "discussions" && (
          <div className="space-y-4">
            <form onSubmit={handleCreateDiscussion} className="space-y-2 pb-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Ask a question</p>
              <input
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
                placeholder="Subject"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
              />
              <textarea
                value={newDiscussionContent}
                onChange={(e) => setNewDiscussionContent(e.target.value)}
                placeholder="Describe your question…"
                required
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none"
              />
              <button
                type="submit"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Post question
              </button>
            </form>
            {discussions.length ? (
              discussions.map((d) => (
                <div key={d.id} className="py-3 border-b border-slate-100 last:border-0">
                  <p className="font-semibold text-slate-900">{d.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{d.content}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {d.author_name} · {d.reply_count} replies
                    {d.is_answered && " · Answered"}
                  </p>
                  <button
                    onClick={() => loadReplies(d.id)}
                    className="text-xs text-teal-600 font-medium mt-2 cursor-pointer"
                  >
                    {expandedDiscussion === d.id ? "Hide replies" : "View replies"}
                  </button>
                  {expandedDiscussion === d.id && (
                    <div className="mt-3 pl-3 border-l-2 border-teal-100 space-y-2">
                      {(replies[d.id] || []).map((r) => (
                        <div key={r.id} className="text-sm">
                          <p className="font-medium text-slate-700">
                            {r.author_name}
                          </p>
                          <p className="text-slate-600">{r.content}</p>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Add a reply…"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none"
                        />
                        <button
                          onClick={() => handleReply(d.id)}
                          className="p-2 bg-teal-600 text-white rounded-lg cursor-pointer"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                No discussions yet — be the first to ask
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

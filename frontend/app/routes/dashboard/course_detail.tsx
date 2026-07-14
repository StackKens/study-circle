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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AiCourseChat from "../../components/AiCourseChat";
import {
  DiscussionCard,
  type Discussion,
  type Reply,
} from "../../components/discussions";

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
  const [tabLoading, setTabLoading] = useState(false);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  const [submitContent, setSubmitContent] = useState("");
  const [submitUrl, setSubmitUrl] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [expandedAssignments, setExpandedAssignments] = useState<
    Record<string, boolean>
  >({});

  const toggleAssignment = (id: string) => {
    setExpandedAssignments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContent, setNewDiscussionContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [likingReply, setLikingReply] = useState<string | null>(null);
  const [showAskForm, setShowAskForm] = useState(false);
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
    setTabLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    if (tab === "announcements") {
      fetch(`${API_URL}/courses/${courseId}/announcements`, { headers })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setAnnouncements(d))
        .finally(() => setTabLoading(false));
    } else if (tab === "resources") {
      fetch(`${API_URL}/courses/${courseId}/resources`, { headers })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setResources(d))
        .finally(() => setTabLoading(false));
    } else if (tab === "assignments") {
      fetch(`${API_URL}/courses/${courseId}/assignments`, { headers })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setAssignments(d))
        .finally(() => setTabLoading(false));
    } else {
      fetch(`${API_URL}/courses/${courseId}/discussions`, { headers })
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setDiscussions(d))
        .finally(() => setTabLoading(false));
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

  function invalidateReplies(discussionId: string) {
    setRepliesMap((prev) => {
      const next = { ...prev };
      delete next[discussionId];
      return next;
    });
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.delete(discussionId);
      return next;
    });
  }

  function loadReplies(discussionId: string) {
    const toggle = () =>
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        if (next.has(discussionId)) next.delete(discussionId);
        else next.add(discussionId);
        return next;
      });

    if (repliesMap[discussionId]) {
      toggle();
      return;
    }
    setLoadingReplies((prev) => new Set(prev).add(discussionId));
    fetch(`${API_URL}/discussions/${discussionId}/replies`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRepliesMap((prev) => ({ ...prev, [discussionId]: data }));
          toggle();
        }
      })
      .finally(() => {
        setLoadingReplies((prev) => {
          const next = new Set(prev);
          next.delete(discussionId);
          return next;
        });
      });
  }

  async function handleReply(discussionId: string, content: string) {
    const res = await fetch(`${API_URL}/discussions/${discussionId}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      invalidateReplies(discussionId);
      const list = await fetch(`${API_URL}/courses/${courseId}/discussions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await list.json();
      if (Array.isArray(data)) setDiscussions(data);
    }
  }

  async function handleEditReply(replyId: string, content: string) {
    const res = await fetch(`${API_URL}/discussions/reply/${replyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const discussionId = Object.entries(repliesMap).find(([, replies]) =>
        replies.some((r) => r.id === replyId),
      )?.[0];
      if (discussionId) invalidateReplies(discussionId);
      const list = await fetch(`${API_URL}/courses/${courseId}/discussions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await list.json();
      if (Array.isArray(data)) setDiscussions(data);
    }
  }

  async function handleToggleLike(replyId: string) {
    if (likingReply) return;
    setLikingReply(replyId);
    try {
      await fetch(`${API_URL}/discussions/reply/${replyId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRepliesMap((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].map((r) =>
            r.id === replyId
              ? {
                  ...r,
                  liked: !r.liked,
                  like_count: r.liked ? r.like_count - 1 : r.like_count + 1,
                }
              : r,
          );
        }
        return next;
      });
    } finally {
      setLikingReply(null);
    }
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

      <div className="mb-5">
        <div className="hidden md:flex gap-1">
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
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => {
              const idx = tabs.findIndex((t) => t.id === tab);
              if (idx > 0) setTab(tabs[idx - 1].id);
            }}
            disabled={tab === tabs[0].id}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200">
            {(() => {
              const t = tabs.find((t) => t.id === tab)!;
              const Icon = t.icon;
              return <Icon size={16} className="text-teal-600" />;
            })()}
            <span className="text-sm font-semibold text-slate-800">
              {tabs.find((t) => t.id === tab)!.label}
            </span>
          </div>
          <button
            onClick={() => {
              const idx = tabs.findIndex((t) => t.id === tab);
              if (idx < tabs.length - 1) setTab(tabs[idx + 1].id);
            }}
            disabled={tab === tabs[tabs.length - 1].id}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {tab === "discussions" && showAskForm && (
        <form onSubmit={handleCreateDiscussion} className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Ask a question</p>
          <input
            value={newDiscussionTitle}
            onChange={(e) => setNewDiscussionTitle(e.target.value)}
            placeholder="Subject"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none mb-2"
          />
          <textarea
            value={newDiscussionContent}
            onChange={(e) => setNewDiscussionContent(e.target.value)}
            placeholder="Describe your question…"
            required
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none mb-3"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Post question
            </button>
            <button
              type="button"
              onClick={() => setShowAskForm(false)}
              className="text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {tab === "announcements" &&
          (tabLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-600" size={24} /></div>
          ) : announcements.length ? (
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
          (tabLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-600" size={24} /></div>
          ) : resources.length ? (
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
          (tabLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-600" size={24} /></div>
          ) : assignments.length ? (
            assignments.map((a) => {
              const open = expandedAssignments[a.id] ?? false;
              return (
                <div
                  key={a.id}
                  id={`assignment-${a.id}`}
                  ref={(el) => { assignmentRefs.current[a.id] = el; }}
                  className="border-b border-slate-100 last:border-0"
                >
                  <button
                    onClick={() => toggleAssignment(a.id)}
                    className="w-full flex items-center justify-between gap-3 py-4 px-1 text-left cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      {a.due_date && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Due {new Date(a.due_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.submitted && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                          Submitted
                        </span>
                      )}
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
                    <div className="pb-4 px-1">
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
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              No assignments yet
            </p>
          ))}

        {tab === "discussions" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">All Questions</p>
              {!showAskForm && (
                <button
                  onClick={() => setShowAskForm(true)}
                  className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <MessageSquare size={13} /> Ask a question
                </button>
              )}
            </div>

            {tabLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-600" size={24} /></div>
            ) : discussions.length ? (
              <div className="space-y-3">
                {discussions.map((d) => (
                  <DiscussionCard
                    key={d.id}
                    discussion={d}
                    expanded={expandedReplies.has(d.id)}
                    replies={repliesMap[d.id]}
                    loadingReplies={loadingReplies.has(d.id)}
                    onToggleReplies={() => loadReplies(d.id)}
                    onReply={(content) => handleReply(d.id, content)}
                    onEditReply={handleEditReply}
                    onToggleLike={handleToggleLike}
                    likingReplyId={likingReply}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">
                No discussions yet
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

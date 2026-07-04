import { useEffect, useState } from "react";
import {
  MessageSquare,
  Loader2,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  Heart,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { UserAvatar } from "../../../components/UserAvatar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Discussion {
  id: string;
  title: string;
  content: string;
  author_name: string;
  is_answered: boolean;
  reply_count: number;
  created_at: string;
  course_id: string;
  course_title: string;
}

interface Reply {
  id: string;
  discussion_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  like_count: number;
  liked: boolean;
}

interface Course {
  id: string;
  title: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InstructorDiscussionsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Discussion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [replyingLoading, setReplyingLoading] = useState(false);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [likingReply, setLikingReply] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newCourse, setNewCourse] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());

  function load() {
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/instructors/me/discussions`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([discussions, coursesData]) => {
        if (Array.isArray(discussions)) setItems(discussions);
        if (Array.isArray(coursesData)) setCourses(coursesData);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [token]);

  function loadReplies(discussionId: string) {
    if (repliesMap[discussionId]) {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        if (next.has(discussionId)) next.delete(discussionId);
        else next.add(discussionId);
        return next;
      });
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
          setExpandedReplies((prev) => new Set(prev).add(discussionId));
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

  async function handleReply(discussionId: string) {
    if (!reply.trim() || replyingLoading) return;
    setReplyingLoading(true);
    try {
      const res = await fetch(`${API_URL}/discussions/${discussionId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: reply }),
      });
      if (res.ok) {
        setReply("");
        setReplyingTo(null);
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
        load();
      }
    } finally {
      setReplyingLoading(false);
    }
  }

  async function handleEditReply(replyId: string) {
    if (!editContent.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_URL}/discussions/reply/${replyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingReply(null);
        setEditContent("");
        const discussionId = Object.entries(repliesMap).find(([, replies]) =>
          replies.some((r) => r.id === replyId),
        )?.[0];
        if (discussionId) {
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
        load();
      }
    } finally {
      setSavingEdit(false);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourse || !newTitle.trim() || !newContent.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/instructors/me/discussions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: newCourse,
          title: newTitle,
          content: newContent,
        }),
      });
      if (res.ok) {
        setShowNew(false);
        setNewCourse("");
        setNewTitle("");
        setNewContent("");
        load();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
            Instructor Portal
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Discussions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Answer questions and keep conversations going across your courses
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="shrink-0 whitespace-nowrap bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
        >
          New Thread
        </button>
      </div>

      {/* New Thread Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          />
          <form
            onSubmit={handleCreate}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Start a Thread</h2>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
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
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Thread title"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What would you like to discuss?"
              rows={4}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-500 outline-none resize-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              {creating ? "Posting…" : "Post Thread"}
            </button>
          </form>
        </div>
      )}

      {/* Discussion list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <MessageSquare size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No discussions yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Threads from your courses will appear here. Start one now.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-500 cursor-pointer"
          >
            Start a Thread
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((d) => {
            const expanded = expandedReplies.has(d.id);
            const replies = repliesMap[d.id];
            return (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-slate-200"
              >
                {/* Main discussion card */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-slate-900 text-sm sm:text-base">
                          {d.title}
                        </span>
                        {d.is_answered && (
                          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle2 size={10} className="sm:size-3" />{" "}
                            Answered
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-400">
                        <span>by {d.author_name}</span>
                        <span>·</span>
                        <span className="text-teal-600">{d.course_title}</span>
                        <span>·</span>
                        <span>{formatDate(d.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {d.content}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    {/* Toggle replies button */}
                    <button
                      onClick={() => loadReplies(d.id)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 font-medium cursor-pointer"
                    >
                      {loadingReplies.has(d.id) ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : expanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      {d.reply_count}{" "}
                      {d.reply_count === 1 ? "reply" : "replies"}
                    </button>

                    {/* Reply button */}
                    {replyingTo !== d.id && (
                      <button
                        onClick={() => {
                          setReplyingTo(d.id);
                          setReply("");
                        }}
                        className="text-xs text-teal-600 font-medium hover:underline cursor-pointer"
                      >
                        Reply
                      </button>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyingTo === d.id && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write your answer…"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(d.id)}
                          disabled={replyingLoading || !reply.trim()}
                          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {replyingLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : null}
                          Reply
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-xs text-slate-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Replies section */}
                {expanded && replies && replies.length > 0 && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {replies.map((r) => (
                      <div
                        key={r.id}
                        className="px-4 sm:px-5 py-3 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <UserAvatar
                            userId={r.author_id}
                            name={r.author_name}
                            avatarUrl={r.author_avatar}
                            size="sm"
                          />
                          <span className="text-xs font-medium text-slate-700">
                            {r.author_name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(r.created_at)}
                          </span>
                          <button
                            onClick={() => handleToggleLike(r.id)}
                            disabled={!!likingReply}
                            className={`ml-auto flex items-center gap-1 text-xs cursor-pointer ${r.liked ? "text-red-500" : "text-slate-400 hover:text-red-400"}`}
                          >
                            <Heart
                              size={11}
                              fill={r.liked ? "currentColor" : "none"}
                            />
                            {r.like_count > 0 && r.like_count}
                          </button>
                          {r.author_id === user?.id &&
                            editingReply !== r.id && (
                              <button
                                onClick={() => {
                                  setEditingReply(r.id);
                                  setEditContent(r.content);
                                }}
                                className="ml-auto text-slate-400 hover:text-teal-600 cursor-pointer"
                              >
                                <Pencil size={11} />
                              </button>
                            )}
                        </div>
                        {editingReply === r.id ? (
                          <div className="ml-7 space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditReply(r.id)}
                                disabled={savingEdit || !editContent.trim()}
                                className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
                              >
                                {savingEdit ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : null}
                                Save
                              </button>
                              <button
                                onClick={() => setEditingReply(null)}
                                className="text-xs text-slate-500 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 ml-7">
                            {r.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expanded && loadingReplies.has(d.id) && (
                  <div className="border-t border-slate-100 px-4 sm:px-5 py-4 flex justify-center">
                    <Loader2 size={16} className="animate-spin text-teal-600" />
                  </div>
                )}

                {expanded && replies && replies.length === 0 && (
                  <div className="border-t border-slate-100 px-4 sm:px-5 py-4 text-center text-xs text-slate-400">
                    No replies yet
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { MessageSquare, Loader2, CheckCircle2, ChevronDown, ChevronRight, Pencil, Heart } from "lucide-react";
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CourseDiscussionsPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token, user } = useAuth();
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [replyingLoading, setReplyingLoading] = useState(false);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [likingReply, setLikingReply] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());

  function load() {
    fetch(`${API_URL}/courses/${courseId}/discussions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId, token]);

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingReply(null);
        setEditContent("");
        const discussionId = Object.entries(repliesMap).find(([, replies]) =>
          replies.some((r) => r.id === replyId)
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
            r.id === replyId ? { ...r, liked: !r.liked, like_count: r.liked ? r.like_count - 1 : r.like_count + 1 } : r
          );
        }
        return next;
      });
    } finally {
      setLikingReply(null);
    }
  }

  return (
    <div>
      <h2 className="font-semibold text-slate-900 mb-4">Discussions</h2>
      <p className="text-sm text-slate-500 mb-4">
        Answer student questions and participate in course discussions
      </p>

      {loading ? (
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={24} />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <MessageSquare size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No discussions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((d) => {
            const expanded = expandedReplies.has(d.id);
            const replies = repliesMap[d.id];
            return (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{d.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        by {d.author_name} · {d.reply_count} replies
                      </p>
                    </div>
                    {d.is_answered && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0">
                        <CheckCircle2 size={12} /> Answered
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {d.content}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
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
                      {d.reply_count} {d.reply_count === 1 ? "reply" : "replies"}
                    </button>

                    {replyingTo !== d.id && (
                      <button
                        onClick={() => { setReplyingTo(d.id); setReply(""); }}
                        className="text-xs text-teal-600 font-medium hover:underline cursor-pointer"
                      >
                        Reply
                      </button>
                    )}
                  </div>

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
                          {replyingLoading ? <Loader2 size={12} className="animate-spin" /> : null}
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

                {expanded && replies && replies.length > 0 && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {replies.map((r) => (
                      <div key={r.id} className="px-4 py-3 bg-slate-50/50">
                        <div className="flex items-center gap-2 mb-1">
                          <UserAvatar userId={r.author_id} name={r.author_name} avatarUrl={r.author_avatar} size="sm" />
                          <span className="text-xs font-medium text-slate-700">{r.author_name}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(r.created_at)}</span>
                          <button
                            onClick={() => handleToggleLike(r.id)}
                            disabled={!!likingReply}
                            className={`ml-auto flex items-center gap-1 text-xs cursor-pointer ${r.liked ? "text-red-500" : "text-slate-400 hover:text-red-400"}`}
                          >
                            <Heart size={11} fill={r.liked ? "currentColor" : "none"} />
                            {r.like_count > 0 && r.like_count}
                          </button>
                          {r.author_id === user?.id && editingReply !== r.id && (
                            <button
                              onClick={() => { setEditingReply(r.id); setEditContent(r.content); }}
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
                                {savingEdit ? <Loader2 size={11} className="animate-spin" /> : null}
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
                          <p className="text-sm text-slate-600 ml-7">{r.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expanded && loadingReplies.has(d.id) && (
                  <div className="border-t border-slate-100 px-4 py-4 flex justify-center">
                    <Loader2 size={16} className="animate-spin text-teal-600" />
                  </div>
                )}

                {expanded && replies && replies.length === 0 && (
                  <div className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-400">
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

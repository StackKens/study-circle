import { useEffect, useState } from "react";
import { MessageSquare, Loader2, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  DiscussionCard,
  type Discussion,
  type Reply,
} from "../../../components/discussions";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Course {
  id: string;
  title: string;
}

export default function InstructorDiscussionsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Discussion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [likingReply, setLikingReply] = useState<string | null>(null);

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
      load();
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
      load();
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
          className="shrink-0 whitespace-nowrap bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
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
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer transition-colors"
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
            className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-500 cursor-pointer transition-colors"
          >
            Start a Thread
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
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
              currentUserId={user?.id}
              likingReplyId={likingReply}
              showCourse
            />
          ))}
        </div>
      )}
    </div>
  );
}

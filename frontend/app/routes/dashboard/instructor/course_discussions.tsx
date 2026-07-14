import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  DiscussionCard,
  type Discussion,
  type Reply,
} from "../../../components/discussions";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export default function CourseDiscussionsPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token, user } = useAuth();
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [likingReply, setLikingReply] = useState<string | null>(null);

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

  return (
    <div>
      <h2 className="font-semibold text-slate-900 mb-4">Discussions</h2>
      <p className="text-sm text-slate-500 mb-4">
        Answer student questions and participate in course discussions
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-teal-600" size={24} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <MessageSquare size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No discussions yet</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

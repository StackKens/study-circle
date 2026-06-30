import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

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

export default function CourseDiscussionsPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token } = useAuth();
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");

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

  async function handleReply(discussionId: string) {
    if (!reply.trim()) return;
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
      load();
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
          {items.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{d.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    by {d.author_name} · {d.reply_count} replies
                  </p>
                </div>
                {d.is_answered && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle2 size={12} /> Answered
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {d.content}
              </p>
              {replyingTo === d.id ? (
                <div className="mt-3 space-y-2">
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
                      className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    >
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
              ) : (
                <button
                  onClick={() => setReplyingTo(d.id)}
                  className="mt-3 text-xs text-teal-600 font-medium cursor-pointer"
                >
                  Reply to this question
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

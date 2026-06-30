import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { Megaphone, Plus, Bell, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-colors";

export default function CourseAnnouncementsPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token } = useAuth();
  const [items, setItems]           = useState<Announcement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  function load() {
    fetch(`${API_URL}/courses/${courseId}/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [courseId, token]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");
      setShowForm(false); setTitle(""); setContent("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-slate-900">Announcements</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-teal-500"
          >
            <Plus size={14} /> Post
          </button>
        )}
      </div>

      {/* Enrolled-only note */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
        <Bell size={13} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          This announcement will only be visible to <span className="font-semibold">students enrolled in this course</span>.
        </p>
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-800">New Announcement</p>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X size={15} className="text-slate-400" />
            </button>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Assignment 2 deadline extended)"
            required
            className={inputClass}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your message to enrolled students…"
            required
            rows={4}
            className={`${inputClass} resize-none`}
          />

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              {submitting ? "Posting…" : "Publish"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-3 bg-slate-100 rounded-full w-1/2 mb-2" />
              <div className="h-2.5 bg-slate-100 rounded-full w-3/4 mb-1" />
              <div className="h-2.5 bg-slate-100 rounded-full w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Megaphone size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No announcements yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Post" to send your first announcement to enrolled students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone size={14} className="text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{a.title}</p>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">{a.content}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(a.created_at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

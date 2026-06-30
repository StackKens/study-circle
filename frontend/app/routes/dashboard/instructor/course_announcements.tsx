import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { Megaphone, Plus, Loader2, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
}

export default function CourseAnnouncementsPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function load() {
    fetch(`${API_URL}/courses/${courseId}/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId, token]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/courses/${courseId}/announcements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      setShowForm(false);
      setTitle("");
      setContent("");
      load();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-slate-900">Announcements</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus size={14} /> Post
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handlePost}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-500"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Message to students…"
            required
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={24} />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Megaphone size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {a.content}
              </p>
              <p className="text-xs text-slate-400 mt-3">
                {new Date(a.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

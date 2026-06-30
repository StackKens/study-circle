import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { FolderOpen, Plus, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  created_at: string;
}

const TYPES = ["pdf", "slides", "document", "link", "video"] as const;

export default function CourseResourcesPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token } = useAuth();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("pdf");
  const [url, setUrl] = useState("");

  function load() {
    fetch(`${API_URL}/courses/${courseId}/resources`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId, token]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/courses/${courseId}/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, type, url }),
    });
    if (res.ok) {
      setShowForm(false);
      setTitle("");
      setUrl("");
      load();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-slate-900">Resources</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus size={14} /> Upload
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleUpload}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Lecture 3 Notes)"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-500"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (Google Drive, PDF link, etc.)"
            required
            type="url"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Add Resource
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs text-slate-500 cursor-pointer"
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
          <FolderOpen size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No resources uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-200 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-800 text-sm">{r.title}</p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">
                  {r.type}
                </p>
              </div>
              <ExternalLink size={14} className="text-teal-600" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

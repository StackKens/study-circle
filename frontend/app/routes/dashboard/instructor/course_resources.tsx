import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import { FolderOpen, ExternalLink, Globe, Lock, Check, X, Upload } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { uploadToCloudinary } from "../../../utils/cloudinary";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const acceptMap: Record<string, string> = {
  pdf:      ".pdf",
  slides:   ".ppt,.pptx",
  document: ".doc,.docx,.ppt,.pptx,.txt",
};

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  is_public: boolean;
  created_at: string;
}

const TYPES = ["pdf", "slides", "document", "link"] as const;

const typeConfig: Record<string, { bg: string; text: string }> = {
  pdf:      { bg: "bg-red-50",    text: "text-red-600"    },
  slides:   { bg: "bg-orange-50", text: "text-orange-600" },
  document: { bg: "bg-teal-50",   text: "text-teal-600"   },
  link:     { bg: "bg-blue-50",   text: "text-blue-600"   },
};

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-colors";

export default function CourseResourcesPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token } = useAuth();
  const [items, setItems]         = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [title, setTitle]         = useState("");
  const [type, setType]           = useState<string>("pdf");
  const [url, setUrl]             = useState("");
  const [file, setFile]           = useState<File | null>(null);
  const [isPublic, setIsPublic]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch(`${API_URL}/courses/${courseId}/resources`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [courseId, token]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError("");
    const isFileType = type !== "link";
    if (isFileType && !file) { setError("Please select a file"); setSubmitting(false); return; }
    if (!isFileType && !url.trim()) { setError("Please enter a URL"); setSubmitting(false); return; }
    try {
      const finalUrl = isFileType ? await uploadToCloudinary(file!) : url.trim();
      const res = await fetch(`${API_URL}/courses/${courseId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), type, url: finalUrl, is_public: isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setShowForm(false); setTitle(""); setUrl(""); setFile(null); setIsPublic(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-slate-900">Resources</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-teal-500"
          >
            Upload
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-800">New Resource</p>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X size={15} className="text-slate-400" />
            </button>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Lecture 3 Notes)"
            required
            className={inputClass}
          />

          <select value={type} onChange={(e) => { setType(e.target.value); setFile(null); }} className={inputClass}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          {type === "link" ? (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube, Google Drive URL, etc."
              required
              type="url"
              className={inputClass}
            />
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptMap[type] ?? acceptMap.document}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-teal-400 hover:text-teal-600 transition-colors cursor-pointer"
              >
                <Upload size={15} />
                {file ? file.name : "Click to select a file from your device"}
              </button>
            </div>
          )}

          {/* Visibility toggle */}
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isPublic ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"}`}
          >
            <div className="flex items-center gap-2">
              {isPublic ? <Globe size={14} className="text-teal-600" /> : <Lock size={14} className="text-slate-400" />}
              <div className="text-left">
                <p className={`text-xs font-semibold ${isPublic ? "text-teal-700" : "text-slate-700"}`}>
                  {isPublic ? "Push to library — visible to everyone" : "Course students only — private"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isPublic ? "Any student on StudyCircle can find this" : "Only students enrolled in this course"}
                </p>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isPublic ? "bg-teal-600 border-teal-600" : "border-slate-300"}`}>
              {isPublic && <Check size={9} className="text-white" />}
            </div>
          </button>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              {submitting ? "Uploading…" : "Add Resource"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                <div className="h-2 bg-slate-100 rounded-full w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <FolderOpen size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No resources uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Upload" to add your first material</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const cfg = typeConfig[r.type] ?? { bg: "bg-slate-50", text: "text-slate-500" };
            return (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-200 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize shrink-0 ${cfg.bg} ${cfg.text}`}>
                    {r.type}
                  </span>
                  <p className="font-medium text-slate-800 text-sm truncate">{r.title}</p>
                  {r.is_public && (
                    <Globe size={12} className="text-teal-500 shrink-0" title="Visible in library" />
                  )}
                </div>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-teal-600 transition-colors shrink-0 ml-2" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

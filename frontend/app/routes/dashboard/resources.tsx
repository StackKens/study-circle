import { useEffect, useRef, useState } from "react";
import { FileText, Link, Video, Download, Upload, X, Check, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useResourceStore } from "../../store/resourceStore";
import { useGroupStore } from "../../store/groupStore";
import type { Resource } from "../../types/resource";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const CLOUDINARY_CLOUD = "db0oxbeck";
const CLOUDINARY_PRESET = "p3mbqg5a";

async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");
  return data.secure_url;
}

const iconMap: Record<Resource["type"], React.ElementType> = {
  pdf: FileText, link: Link, video: Video, document: FileText,
};

const typeConfig: Record<Resource["type"], { bg: string; text: string; label: string }> = {
  pdf:      { bg: "bg-red-50",    text: "text-red-500",    label: "PDF"      },
  link:     { bg: "bg-blue-50",   text: "text-blue-500",   label: "Link"     },
  video:    { bg: "bg-purple-50", text: "text-purple-500", label: "Video"    },
  document: { bg: "bg-teal-50",   text: "text-teal-500",   label: "Document" },
};

const acceptMap: Record<string, string> = {
  pdf:      ".pdf",
  document: ".doc,.docx,.ppt,.pptx,.txt",
  video:    "video/*",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getViewUrl(type: Resource["type"], url: string) {
  return url;
}

async function forceDownload(url: string, title: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = url.split(".").pop()?.split("?")[0] || "";
  const filename = `${title.replace(/\s+/g, "_")}.${ext}`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ResourcesPage() {
  const { token } = useAuth();
  const { resources, isLoading, fetchResources, addResource } = useResourceStore();
  const { groups, fetchGroups } = useGroupStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    type: "link" as Resource["type"],
    group_id: "",
    url: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    fetchResources(token);
    if (groups.length === 0) fetchGroups(token);
  }, [token, fetchResources, fetchGroups]);

  const isFileType = formData.type !== "link";

  const resetModal = () => {
    setIsModalOpen(false);
    setError("");
    setFile(null);
    setFormData({ title: "", type: "link", group_id: "", url: "" });
  };

  const handleUpload = async () => {
    if (!formData.title || !formData.group_id) {
      setError("Title and group are required");
      return;
    }
    if (isFileType && !file) {
      setError("Please select a file");
      return;
    }
    if (!isFileType && !formData.url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const url = isFileType ? await uploadToCloudinary(file!) : formData.url.trim();

      const res = await fetch(`${API_URL}/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload resource");
      addResource(data);
      resetModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 bg-white";

  return (
    <div className="max-w-4xl mx-auto px-1">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
            Materials
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resources</h1>
          <p className="text-slate-500 text-sm mt-1">Shared materials from your study groups</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Upload size={15} /> Upload
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading...</div>
      ) : resources.length > 0 ? (
        <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {resources.map((resource) => {
            const Icon = iconMap[resource.type];
            const config = typeConfig[resource.type];
            return (
              <div key={resource.id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 ${config.bg} ${config.text} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm leading-snug">{resource.title}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {config.label} · {resource.uploaded_by_name} · {formatDate(resource.created_at)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{resource.group_name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                      <Download size={12} /> {resource.downloads}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2.5">
                    <a
                      href={getViewUrl(resource.type, resource.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      View
                    </a>
                    {resource.type !== "link" && (
                      <button
                        onClick={() => forceDownload(resource.url, resource.title)}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText size={22} className="text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No resources yet</p>
          <p className="text-sm text-slate-400 mb-5">Share a link, PDF, or document with your group</p>
          <button onClick={() => setIsModalOpen(true)} className="text-sm text-teal-600 font-semibold">
            Upload the first resource →
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Upload Resource</h2>
              <button onClick={resetModal} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lecture Notes Week 10"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value as Resource["type"], url: "" });
                    setFile(null);
                  }}
                  className={inputClass}
                >
                  <option value="link">Link</option>
                  <option value="pdf">PDF</option>
                  <option value="document">Document</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Study group</label>
                <select
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select a group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                {groups.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">No groups yet — create one first.</p>
                )}
              </div>

              {/* Conditional input based on type */}
              {isFileType ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptMap[formData.type]}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-teal-400 hover:text-teal-600 transition-colors text-left"
                  >
                    {file ? file.name : "Click to select a file"}
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    className={inputClass}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button
                onClick={resetModal}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isSubmitting}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

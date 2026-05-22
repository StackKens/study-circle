// app/routes/dashboard/resources.tsx
import { useState } from "react";
import {
  FileText,
  Link,
  Video,
  Download,
  Star,
  Upload,
  X,
  Check,
} from "lucide-react";
import type { Resource } from "../../types/resource";

const mockResources: Resource[] = [
  {
    id: "1",
    groupId: "g1",
    title: "Data Structures Lecture Notes – Week 10",
    type: "pdf",
    uploadedBy: "Alice Nkosi",
    downloads: 24,
    ratings: 4,
    createdAt: "2026-05-15T10:00:00Z",
  },
  {
    id: "2",
    groupId: "g1",
    title: "Sorting Algorithms Visualization",
    type: "video",
    uploadedBy: "Bob Mwangi",
    downloads: 18,
    ratings: 5,
    createdAt: "2026-05-14T14:30:00Z",
  },
  {
    id: "3",
    groupId: "g2",
    title: "Database Normalization Cheatsheet",
    type: "document",
    uploadedBy: "Carol Atim",
    downloads: 32,
    ratings: 4,
    createdAt: "2026-05-16T09:15:00Z",
  },
  {
    id: "4",
    groupId: "g3",
    title: "React Hooks Official Docs",
    type: "link",
    uploadedBy: "David Ochieng",
    downloads: 12,
    ratings: 5,
    createdAt: "2026-05-17T11:00:00Z",
  },
];

const iconMap = { pdf: FileText, link: Link, video: Video, document: FileText };

const typeConfig: Record<string, { bg: string; text: string; label: string }> =
  {
    pdf: { bg: "bg-red-50", text: "text-red-500", label: "PDF" },
    link: { bg: "bg-blue-50", text: "text-blue-500", label: "Link" },
    video: { bg: "bg-purple-50", text: "text-purple-500", label: "Video" },
    document: { bg: "bg-teal-50", text: "text-teal-500", label: "Doc" },
  };

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={
            s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
          }
        />
      ))}
    </div>
  );
}

// Mock groups for dropdown (would come from API)
const mockGroups = [
  { id: "g1", name: "Data Structures & Algorithms" },
  { id: "g2", name: "Database Systems" },
  { id: "g3", name: "Web Development" },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState(mockResources);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "pdf" as "pdf" | "link" | "video" | "document",
    groupId: "",
    url: "",
  });

  const handleUpload = () => {
    if (!formData.title || !formData.groupId || !formData.url) {
      alert("Please fill all fields");
      return;
    }

    const newResource: Resource = {
      id: Date.now().toString(),
      groupId: formData.groupId,
      title: formData.title,
      type: formData.type,
      uploadedBy: "You", // would come from auth context
      downloads: 0,
      ratings: 0,
      createdAt: new Date().toISOString(),
    };

    setResources([newResource, ...resources]);
    setIsModalOpen(false);
    setFormData({ title: "", type: "pdf", groupId: "", url: "" });
  };

  return (
    <div className="max-w-4xl mx-auto px-1">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
            Materials
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Resources
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Shared materials from your study groups
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Upload size={15} /> Upload
        </button>
      </div>

      {resources.length > 0 ? (
        <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {resources.map((resource) => {
            const Icon = iconMap[resource.type];
            const config = typeConfig[resource.type];
            return (
              <div
                key={resource.id}
                className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-10 h-10 ${config.bg} ${config.text} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <Icon size={17} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm leading-snug">
                        {resource.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {config.label} · {resource.uploadedBy} ·{" "}
                        {formatDate(resource.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Download size={12} /> {resource.downloads}
                      </span>
                      <Stars rating={resource.ratings} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2.5">
                    <button className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                      View
                    </button>
                    <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      Download
                    </button>
                    <button className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                      Report
                    </button>
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
          <p className="text-sm text-slate-400 mb-5">
            Be the first to share something useful
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-teal-600 font-semibold"
          >
            Upload resource →
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                Upload Resource
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Lecture Notes Week 10"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 bg-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="document">Document</option>
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Study Group
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) =>
                    setFormData({ ...formData, groupId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 bg-white"
                >
                  <option value="">Select group</option>
                  {mockGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  File URL or Link
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com/file.pdf"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Check size={16} /> Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

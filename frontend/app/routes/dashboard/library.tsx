import { useEffect, useMemo, useState } from "react";
import { FileText, Link, Video, Download, Search, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Resource } from "../../types/resource";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const iconMap: Record<Resource["type"], React.ElementType> = {
  pdf: FileText, link: Link, video: Video, document: FileText,
};

const typeConfig: Record<Resource["type"], { bg: string; text: string; label: string }> = {
  pdf:      { bg: "bg-red-50",    text: "text-red-500",    label: "PDF"      },
  link:     { bg: "bg-blue-50",   text: "text-blue-500",   label: "Link"     },
  video:    { bg: "bg-purple-50", text: "text-purple-500", label: "Video"    },
  document: { bg: "bg-teal-50",   text: "text-teal-500",   label: "Document" },
};

const typeFilters = ["all", "pdf", "document", "video", "link"] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

async function forceDownload(url: string, title: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = url.split(".").pop()?.split("?")[0] || "";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/\s+/g, "_")}.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function LibraryPage() {
  const { token } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<typeof typeFilters[number]>("all");
  const [activeCourse, setActiveCourse] = useState("all");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/resources/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setResources(data); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  const courses = useMemo(() => {
    const unique = Array.from(new Set(resources.map((r) => r.subject).filter(Boolean)));
    return unique.sort();
  }, [resources]);

  const filtered = resources.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.uploaded_by_name.toLowerCase().includes(search.toLowerCase());
    const matchType = activeType === "all" || r.type === activeType;
    const matchCourse = activeCourse === "all" || r.subject === activeCourse;
    return matchSearch && matchType && matchCourse;
  });

  const clearFilters = () => {
    setActiveType("all");
    setActiveCourse("all");
    setSearch("");
  };

  const hasFilters = activeType !== "all" || activeCourse !== "all" || search !== "";

  return (
    <div className="max-w-5xl mx-auto px-1">
      <div className="mb-8">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Library
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Materials</h1>
        <p className="text-slate-500 text-sm mt-1">Everything shared across all groups</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by title or uploader…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition-all"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Type filters */}
        {typeFilters.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              activeType === type
                ? "bg-teal-600 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {type}
          </button>
        ))}

        {/* Divider */}
        {courses.length > 0 && <div className="w-px bg-slate-200 mx-1" />}

        {/* Course filters */}
        {courses.map((course) => (
          <button
            key={course}
            onClick={() => setActiveCourse(activeCourse === course ? "all" : course)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeCourse === course
                ? "bg-slate-800 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {course}
          </button>
        ))}

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 border border-slate-200 bg-white transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-3">
        {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading...</div>
      ) : filtered.length > 0 ? (
        <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.map((resource) => {
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
                      <p className="text-xs text-slate-400 mt-0.5">
                        {resource.group_name} · <span className="text-slate-500">{resource.subject}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                      <Download size={12} /> {resource.downloads}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2.5">
                    <a
                      href={resource.url}
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
          <p className="font-medium text-slate-700 mb-1">No resources found</p>
          <p className="text-sm text-slate-400">
            {hasFilters ? "Try adjusting your filters" : "Nothing has been shared yet"}
          </p>
        </div>
      )}
    </div>
  );
}

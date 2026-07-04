import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  FolderOpen, ArrowRight, Users, BookOpen,
  FileText, Link as LinkIcon, X, ChevronRight,
  Globe, Lock, Check, Upload,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { uploadToCloudinary } from "../../../utils/cloudinary";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const acceptMap: Record<string, string> = {
  pdf:      ".pdf",
  slides:   ".ppt,.pptx",
  document: ".doc,.docx,.ppt,.pptx,.txt",
};

interface Course {
  id: string;
  title: string;
  code: string | null;
  student_count: number;
  resource_count: number;
}

type ResourceType = "pdf" | "slides" | "document" | "link";
type Step = "type" | "course" | "form";

const TYPE_OPTIONS: {
  value: ResourceType;
  label: string;
  icon: React.ElementType;
  desc: string;
  color: string;
}[] = [
  { value: "pdf",      label: "PDF",      icon: FileText,  desc: "Lecture notes, past papers",                              color: "bg-red-50 text-red-600 border-red-100"      },
  { value: "slides",   label: "Slides",   icon: BookOpen,  desc: "Presentation slides",                                     color: "bg-orange-50 text-orange-600 border-orange-100" },
  { value: "document", label: "Document", icon: FileText,  desc: "Word docs, text files",                                   color: "bg-teal-50 text-teal-600 border-teal-100"   },
  { value: "link",     label: "Link",     icon: LinkIcon,  desc: "YouTube, Google Drive or any URL — use this for videos",  color: "bg-blue-50 text-blue-600 border-blue-100"   },
];

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-colors";

export default function InstructorResourcesHub() {
  const { token } = useAuth();
  const [courses, setCourses]   = useState<Course[]>([]);
  const [loading, setLoading]   = useState(true);

  // upload flow
  const [step, setStep]                     = useState<Step | null>(null);
  const [selectedType, setSelectedType]     = useState<ResourceType | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [title, setTitle]                   = useState("");
  const [url, setUrl]                       = useState("");
  const [file, setFile]                     = useState<File | null>(null);
  const [isPublic, setIsPublic]             = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadCourses() {
    fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCourses(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCourses(); }, [token]);

  const totalResources = courses.reduce((s, c) => s + (c.resource_count ?? 0), 0);
  const totalStudents  = courses.reduce((s, c) => s + (c.student_count  ?? 0), 0);

  function startUpload() {
    setStep("type"); setSelectedType(null); setSelectedCourse(null);
    setTitle(""); setUrl(""); setFile(null); setIsPublic(false); setError("");
  }

  function pickType(t: ResourceType) { setSelectedType(t); setStep("course"); }
  function pickCourse(c: Course)     { setSelectedCourse(c); setStep("form"); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse || !selectedType) return;
    setSubmitting(true); setError("");
    const isFileType = selectedType !== "link";
    if (isFileType && !file) { setError("Please select a file"); setSubmitting(false); return; }
    if (!isFileType && !url.trim()) { setError("Please enter a URL"); setSubmitting(false); return; }
    try {
      const finalUrl = isFileType ? await uploadToCloudinary(file!) : url.trim();
      const res = await fetch(`${API_URL}/courses/${selectedCourse.id}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), type: selectedType, url: finalUrl, is_public: isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStep(null);
      loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">Instructor Portal</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Resources</h1>
        <p className="text-sm text-slate-500 mt-1">Share lecture notes, PDFs, slides, and links with your students</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: FolderOpen, value: totalResources, label: "Total Resources", color: "bg-teal-50 text-teal-600" },
          { icon: BookOpen,   value: courses.length, label: "Courses",         color: "bg-blue-50 text-blue-600" },
          { icon: Users,      value: totalStudents,  label: "Total Students",  color: "bg-violet-50 text-violet-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${k.color}`}>
              <k.icon size={15} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Visibility note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Lock size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 leading-relaxed">
          <span className="font-semibold">Resources are private by default</span> — only enrolled students can see them.
          Toggle <span className="font-semibold">"Push to library"</span> when uploading to share with everyone on the platform.
        </p>
      </div>

      {/* Share button — hidden while flow is open */}
      {!step && (
        <button
          onClick={startUpload}
          disabled={courses.length === 0}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FolderOpen size={16} /> Share a Resource
        </button>
      )}

      {/* ── Step 1: pick type ── */}
      {step === "type" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-slate-900">Step 1 — What type of resource?</p>
            <button onClick={() => setStep(null)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X size={16} className="text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => pickType(t.value)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left hover:shadow-sm transition-all cursor-pointer ${t.color}`}
              >
                <t.icon size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs opacity-70 mt-0.5 leading-snug">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: pick course ── */}
      {step === "course" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-sm">
              <button onClick={() => setStep("type")} className="text-slate-400 hover:text-teal-600 cursor-pointer">Type</button>
              <ChevronRight size={13} className="text-slate-300" />
              <span className="font-semibold text-slate-900">Step 2 — Pick a course</span>
            </div>
            <button onClick={() => setStep(null)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X size={16} className="text-slate-400" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">Which course is this <span className="font-medium text-slate-600 capitalize">{selectedType}</span> for?</p>
          <div className="space-y-2">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => pickCourse(c)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.code || "No code"} · {c.student_count} student{c.student_count !== 1 ? "s" : ""}</p>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: fill details ── */}
      {step === "form" && selectedCourse && selectedType && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-sm">
              <button onClick={() => setStep("type")}   className="text-slate-400 hover:text-teal-600 cursor-pointer">Type</button>
              <ChevronRight size={13} className="text-slate-300" />
              <button onClick={() => setStep("course")} className="text-slate-400 hover:text-teal-600 cursor-pointer">Course</button>
              <ChevronRight size={13} className="text-slate-300" />
              <span className="font-semibold text-slate-900">Step 3 — Details</span>
            </div>
            <button onClick={() => setStep(null)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          {/* breadcrumb badges */}
          <div className="flex items-center gap-2 mt-2 mb-4">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">{selectedType}</span>
            <ChevronRight size={11} className="text-slate-300" />
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 truncate max-w-[180px]">{selectedCourse.title}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Week 4 Lecture Notes" className={inputClass} />
            </div>
            {selectedType === "link" ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">URL (YouTube, Google Drive, etc.)</label>
                <input value={url} onChange={(e) => setUrl(e.target.value)} required type="url" placeholder="https://" className={inputClass} />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptMap[selectedType] ?? acceptMap.document}
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
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${isPublic ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"}`}
            >
              <div className="flex items-center gap-2.5">
                {isPublic ? <Globe size={16} className="text-teal-600" /> : <Lock size={16} className="text-slate-400" />}
                <div className="text-left">
                  <p className={`text-sm font-semibold ${isPublic ? "text-teal-700" : "text-slate-700"}`}>
                    {isPublic ? "Push to library — visible to everyone" : "Course students only — private"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isPublic ? "Any student on StudyCircle can find and download this" : "Only students enrolled in this course can see it"}
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isPublic ? "bg-teal-600 border-teal-600" : "border-slate-300"}`}>
                {isPublic && <Check size={11} className="text-white" />}
              </div>
            </button>

            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting ? "Sharing…" : "Share Resource"}
              </button>
              <button type="button" onClick={() => setStep(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Course list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderOpen size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No courses yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Create a course first, then share materials with your students.</p>
          <Link to="/dashboard/instructor/courses" className="inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-500">
            Go to My Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Browse by course</p>
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/dashboard/instructor/courses/${c.id}/resources`}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-teal-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                  <FolderOpen size={16} className="text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.code || "No code"} · {c.student_count} student{c.student_count !== 1 ? "s" : ""} · {c.resource_count} resource{c.resource_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ArrowRight size={15} className="text-slate-400 group-hover:text-teal-600 transition-colors shrink-0 ml-3" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

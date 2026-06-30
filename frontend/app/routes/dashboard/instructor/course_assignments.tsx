import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { ClipboardList, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  submission_count: number;
}

interface Submission {
  id: string;
  student_name: string;
  content: string | null;
  url: string | null;
  submitted_at: string;
}

export default function CourseAssignmentsPage() {
  const { courseId } = useOutletContext<{ courseId: string }>();
  const { token } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  function load() {
    fetch(`${API_URL}/courses/${courseId}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [courseId, token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/courses/${courseId}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        due_date: dueDate || null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      load();
    }
  }

  async function toggleSubmissions(assignmentId: string) {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);
    const res = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setSubmissions(data);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-slate-900">Assignments</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none"
          />
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
          />
          <button
            type="submit"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Create Assignment
          </button>
        </form>
      )}

      {loading ? (
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={24} />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <ClipboardList size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-4">
                <p className="font-semibold text-slate-900">{a.title}</p>
                {a.description && (
                  <p className="text-sm text-slate-500 mt-1">{a.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-400">
                    {a.due_date
                      ? `Due ${new Date(a.due_date).toLocaleString()}`
                      : "No due date"}{" "}
                    · {a.submission_count} submissions
                  </p>
                  <button
                    onClick={() => toggleSubmissions(a.id)}
                    className="flex items-center gap-1 text-xs text-teal-600 font-medium cursor-pointer"
                  >
                    View submissions{" "}
                    {expandedId === a.id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>
              </div>
              {expandedId === a.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-2">
                  {submissions.length === 0 ? (
                    <p className="text-xs text-slate-400">No submissions yet</p>
                  ) : (
                    submissions.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {s.student_name}
                        </p>
                        {s.content && (
                          <p className="text-xs text-slate-500 mt-1">
                            {s.content}
                          </p>
                        )}
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-600 mt-1 inline-block"
                          >
                            View submission →
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

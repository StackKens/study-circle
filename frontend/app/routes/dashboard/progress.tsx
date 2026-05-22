import { useEffect, useState } from "react";
import { Users, Calendar, FolderOpen, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface GroupProgress {
  id: string;
  name: string;
  subject: string;
  university: string;
  role: "admin" | "member";
  member_count: number;
  session_count: number;
  resource_count: number;
  last_session: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "No sessions yet";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function ProgressPage() {
  const { token } = useAuth();
  const [groups, setGroups] = useState<GroupProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/users/me/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setGroups(data); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) return <div className="text-center py-20 text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-1">
      <div className="mb-8">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Progress
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Group Progress</h1>
        <p className="text-slate-500 text-sm mt-1">Activity overview across your study groups</p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={22} className="text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No groups yet</p>
          <p className="text-sm text-slate-400">Join or create a group to track progress</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 leading-snug">{group.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{group.subject} · {group.university}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  group.role === "admin"
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {group.role}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-center mb-1.5">
                    <Users size={16} className="text-teal-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{group.member_count}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Members</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-center mb-1.5">
                    <Calendar size={16} className="text-blue-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{group.session_count}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sessions</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-center mb-1.5">
                    <FolderOpen size={16} className="text-purple-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{group.resource_count}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Resources</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Last session — <span className="text-slate-600 font-medium">{formatDate(group.last_session)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

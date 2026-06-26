import { useEffect, useState } from "react";
import { Users, Calendar, FolderOpen, TrendingUp, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

interface GroupRecommendation {
  id: string;
  name: string;
  subject: string;
  university: string;
  total_members: number;
  score: number;
  reason: string;
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
  const [recommendations, setRecommendations] = useState<GroupRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!token || groups.length > 0 || isLoading) return;
    setRecsLoading(true);
    fetch(`${API_URL}/groups/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecommendations(data); })
      .catch(console.error)
      .finally(() => setRecsLoading(false));
  }, [token, groups.length, isLoading]);

  async function handleJoin(groupId: string) {
    if (!token) return;
    setJoiningId(groupId);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRecommendations((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      console.error("joinGroup error:", err);
    } finally {
      setJoiningId(null);
    }
  }

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
        <div className="space-y-6">
          {/* Empty state */}
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800 text-base mb-1">No progress to show yet</p>
            <p className="text-sm text-slate-400 max-w-sm">
              You're not part of any study group. Join one below to start tracking sessions, resources, and activity.
            </p>
          </div>

          {/* Recommended groups */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Suggested Groups to Join</p>
                  <p className="text-sm text-slate-500 mt-0.5">Matched to your course and university</p>
                </div>
              </div>
              <Link
                to="/dashboard/groups"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors shrink-0"
              >
                See all <ArrowRight size={12} />
              </Link>
            </div>

            {recsLoading ? (
              <div className="py-8 flex items-center justify-center text-sm text-slate-400 gap-2">
                <Loader2 size={16} className="animate-spin" /> Finding groups for you...
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {recommendations.map((group) => (
                  <div key={group.id} className="rounded-lg border border-slate-200 p-4 bg-slate-50/60">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm leading-snug">{group.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{group.subject} · {group.university}</p>
                      </div>
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md shrink-0">
                        {group.score}% match
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{group.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users size={11} /> {group.total_members} members
                      </span>
                      <button
                        onClick={() => handleJoin(group.id)}
                        disabled={joiningId === group.id}
                        className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {joiningId === group.id ? <Loader2 size={12} className="animate-spin" /> : "Join"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 mb-3">No recommendations available right now.</p>
                <Link
                  to="/dashboard/groups"
                  className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Browse all groups →
                </Link>
              </div>
            )}
          </div>
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

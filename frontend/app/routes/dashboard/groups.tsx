import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Users,
  Calendar,
  Plus,
  ArrowRight,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useGroupStore } from "../../store/groupStore";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface GroupRecommendation {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  university: string;
  total_members: number;
  session_count: number;
  resource_count: number;
  score: number;
  reason: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GroupsPage() {
  const { token } = useAuth();
  const { groups, isLoading, fetchGroups } = useGroupStore();
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [recommendations, setRecommendations] = useState<GroupRecommendation[]>(
    [],
  );
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const focusedGroupId = searchParams.get("focus");

  async function fetchRecommendations() {
    if (!token) return;
    setRecommendationsLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to load recommendations");
      setRecommendations(data);
    } catch (err) {
      console.error("fetchRecommendations error:", err);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }

  async function handleJoinGroup(groupId: string) {
    if (!token) return;
    setJoiningGroupId(groupId);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join group");
      await fetchGroups(token);
      setRecommendations((current) => current.filter((g) => g.id !== groupId));
    } catch (err) {
      console.error("joinGroup error:", err);
    } finally {
      setJoiningGroupId(null);
    }
  }

  function handleToggleGroup(groupId: string) {
    setOpenGroupId((current) => {
      if (current === groupId) return null;
      setActiveTab("chat");
      return groupId;
    });
  }

  useEffect(() => {
    if (!token) return;
    fetchGroups(token);
    fetchRecommendations();
  }, [token]);

  return (
    <div className="max-w-5xl mx-auto px-1">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
            Workspace
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Study Groups
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and explore your study circles
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          <Plus size={15} /> Create Group
        </button>
      </div>

      {/* Smart Recommendations */}
      <section className="mb-8 bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                Smart Recommendations
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                Groups matched to your course, university, and study activity
              </p>
            </div>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={recommendationsLoading}
            className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 disabled:opacity-60 flex items-center justify-center transition-colors"
            aria-label="Refresh recommendations"
            title="Refresh recommendations"
          >
            {recommendationsLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>

        {recommendationsLoading ? (
          <div className="py-8 flex items-center justify-center text-sm text-slate-400 gap-2">
            <Loader2 size={16} className="animate-spin" />
            Finding good matches...
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {recommendations.map((group) => (
              <div
                key={group.id}
                className="rounded-lg border border-slate-200 p-4 bg-slate-50/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {group.subject} · {group.university}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md shrink-0">
                    {group.score}% match
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mt-3">
                  {group.reason}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {group.total_members}
                    </span>
                    <span>{group.session_count} sessions</span>
                  </div>
                  <button
                    onClick={() => handleJoinGroup(group.id)}
                    disabled={joiningGroupId === group.id}
                    className="bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {joiningGroupId === group.id && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-5 text-center">
            No new group matches yet. Create more groups or check again later.
          </p>
        )}
      </section>

      {/* Groups list */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Loading...
        </div>
      ) : groups.length > 0 ? (
        <div className="space-y-3">
          {/* 2-column grid of summary cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {groups.map((group) => {
              const isFocused = focusedGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className={`bg-white rounded-xl border p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col ${
                    isFocused ? "border-teal-300 ring-2 ring-teal-100" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 leading-snug">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {group.subject} · {group.university}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                      <Users size={11} /> {group.total_members}
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
                    {group.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar size={11} /> {formatDate(group.created_at)}
                    </div>
                    <Link
                      to={`/dashboard/groups/${group.id}`}
                      className="text-sm text-teal-600 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
                    >
                      Open <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users size={22} className="text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No groups yet</p>
          <p className="text-sm text-slate-400 mb-5">
            Create a group to start collaborating
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-teal-600 font-semibold cursor-pointer"
          >
            Create your first group →
          </button>
        </div>
      )}

      <CreateGroupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setShowModal(false)}
      />
    </div>
  );
}

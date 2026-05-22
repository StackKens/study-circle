import { useState, useEffect, useCallback } from "react";
import { Users, Calendar, Plus, ArrowRight } from "lucide-react";
import type { Group } from "../../types/group";
import { useAuth } from "../../context/AuthContext";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GroupsPage() {
  const { token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setGroups(data);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <div className="max-w-5xl mx-auto px-1">
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
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={15} /> Create Group
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Loading groups...
        </div>
      ) : groups.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col"
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
                <button className="text-sm text-teal-600 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all">
                  Open <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users size={22} className="text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No groups yet</p>
          <p className="text-sm text-slate-400 mb-5">
            Create a group to get started
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-teal-600 font-semibold"
          >
            Create your first group →
          </button>
        </div>
      )}

      <CreateGroupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          fetchGroups();
        }}
      />
    </div>
  );
}

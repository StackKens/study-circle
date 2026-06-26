import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  BookOpen,
  GraduationCap,
  MessageSquare,
  ArrowLeft,
  Calendar,
  Crown,
  LogOut,
  UserPlus,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { Group } from "../../types/group";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Member {
  user_id: string;
  name: string;
  university: string;
  course: string;
  year_of_study: number;
  role: "admin" | "member";
  joined_at: string;
  avatar_url?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// Avatar pill — teal gradient with initials
function Avatar({
  name,
  size = "md",
  isAdmin,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  isAdmin?: boolean;
}) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center font-semibold text-white`}
      >
        {getInitials(name)}
      </div>
      {isAdmin && (
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
          <Crown size={9} className="text-amber-900" />
        </span>
      )}
    </div>
  );
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch group details
  useEffect(() => {
    if (!groupId || !token) return;
    setIsLoadingGroup(true);
    fetch(`${API_URL}/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setGroup(data);
      })
      .catch(() => setError("Failed to load group"))
      .finally(() => setIsLoadingGroup(false));
  }, [groupId, token]);

  // Fetch members
  useEffect(() => {
    if (!groupId || !token) return;
    setIsLoadingMembers(true);
    fetch(`${API_URL}/groups/${groupId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(console.error)
      .finally(() => setIsLoadingMembers(false));
  }, [groupId, token]);

  const isMember = !!group?.role;
  const isAdmin = group?.role === "admin";

  const handleJoin = async () => {
    if (!token || !groupId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      setGroup((g) =>
        g ? { ...g, role: "member", total_members: g.total_members + 1 } : g,
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!token || !groupId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to leave");
      }
      setGroup((g) =>
        g
          ? {
              ...g,
              role: undefined,
              total_members: Math.max(0, g.total_members - 1),
            }
          : g,
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading skeleton
  if (isLoadingGroup) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex flex-col items-center text-center gap-3">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm font-medium text-red-700">
            {error || "Group not found"}
          </p>
          <button
            onClick={() => navigate("/dashboard/groups")}
            className="mt-1 text-sm text-slate-600 hover:text-teal-600 underline underline-offset-2"
          >
            Back to groups
          </button>
        </div>
      </div>
    );
  }

  const admin = members.find((m) => m.role === "admin");

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back link */}
      <Link
        to="/dashboard/groups"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft size={15} />
        All groups
      </Link>

      {/* ── Hero card */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 md:p-6">
          {/* Role badge */}
          {isMember && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${
                isAdmin
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-teal-50 text-teal-700 border border-teal-200"
              }`}
            >
              {isAdmin ? <Crown size={11} /> : <Users size={11} />}
              {isAdmin ? "Admin" : "Member"}
            </span>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            {group.name}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <BookOpen size={12} className="text-teal-600" />
              {group.subject}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <GraduationCap size={12} className="text-teal-600" />
              {group.university}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <Users size={12} className="text-teal-600" />
              {group.total_members}{" "}
              {group.total_members === 1 ? "member" : "members"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Calendar size={12} />
              Created {formatDate(group.created_at)}
            </span>
          </div>

          {/* Description */}
          {group.description && (
            <p className="mt-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-5">
              {group.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {isMember ? (
              <>
                <Link
                  to={`/dashboard/groups/${groupId}/chat`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                >
                  <MessageSquare size={16} />
                  Open group chat
                </Link>
                {!isAdmin && (
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <LogOut size={15} />
                    )}
                    Leave group
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:bg-teal-300 cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <UserPlus size={15} />
                )}
                Join group
              </button>
            )}
          </div>

          {error && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* ── Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Members",
            value: group.total_members,
            icon: Users,
            color: "text-teal-600",
            bg: "bg-teal-50",
          },
          {
            label: "Created",
            value: timeAgo(group.created_at),
            icon: Clock,
            color: "text-slate-600",
            bg: "bg-slate-100",
          },
          {
            label: "Your role",
            value: isAdmin ? "Admin" : isMember ? "Member" : "Guest",
            icon: isAdmin ? Crown : Users,
            color: isAdmin ? "text-amber-600" : "text-slate-600",
            bg: isAdmin ? "bg-amber-50" : "bg-slate-100",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1.5"
          >
            <div
              className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}
            >
              <stat.icon size={15} className={stat.color} />
            </div>
            <p className="text-lg font-bold text-slate-900 leading-none">
              {stat.value}
            </p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Members list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Members
            <span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {group.total_members}
            </span>
          </h2>
        </div>

        {isLoadingMembers ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                  <div className="h-2.5 w-24 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No members found
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <Avatar name={member.name} isAdmin={member.role === "admin"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-2">
                    {member.name}
                    {member.user_id === user?.id && (
                      <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {member.course} · Y{member.year_of_study} ·{" "}
                    {member.university}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {member.role === "admin" ? (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 hidden sm:block">
                      Joined {timeAgo(member.joined_at)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

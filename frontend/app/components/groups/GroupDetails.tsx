import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { usePrivateChat } from "../../context/PrivateChatContext";
import { UserAvatar } from "../UserAvatar";
import {
  Users,
  BookOpen,
  GraduationCap,
  MessageSquare,
  ArrowLeft,
  Calendar,
  Crown,
  LogOut,
  Loader2,
  Clock,
  AlertCircle,
  Link2,
  Copy,
  Check,
  X,
} from "lucide-react";
import type { Group } from "../../types/group";
import type { GroupMember } from "../../types/groupMember";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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
  url,
  size = "md",
  isAdmin,
}: {
  name: string;
  url?: string | null;
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
      {url ? (
        <img
          src={url}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover border border-slate-100`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center font-semibold text-white`}
        >
          {getInitials(name)}
        </div>
      )}
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
  const { openChat } = usePrivateChat();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  // Invite link state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!groupId || !token) return;
    setIsLoadingGroup(true);
    setPageError("");

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load group");
      setGroup(data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setIsLoadingGroup(false);
    }
  }, [groupId, token]);

  const fetchMembers = useCallback(async () => {
    if (!groupId || !token) return;
    setIsLoadingMembers(true);

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load members");
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchMembers error:", err);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [groupId, token]);

  // Fetch group details
  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Fetch members
  useEffect(() => {
    if (group?.role) fetchMembers();
    else {
      setMembers([]);
      setIsLoadingMembers(false);
    }
  }, [fetchMembers, group?.role]);

  const isMember = !!group?.role;
  const isAdmin = group?.role === "admin";

  const handleGetInviteLink = async () => {
    if (!token || !groupId) return;
    setInviteLoading(true);
    setInviteError("");
    setShowInviteModal(true);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/invite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate invite link");
      setInviteUrl(data.invite_url);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to generate link");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the input
    }
  };

  const handleJoin = async () => {
    if (!token || !groupId) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      setGroup(data);
      await fetchMembers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!token || !groupId) return;
    setActionLoading(true);
    setActionError("");
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
              total_members: Math.max(0, Number(g.total_members) - 1),
            }
          : g,
      );
      setMembers([]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to leave");
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

  if (pageError || !group) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex flex-col items-center text-center gap-3">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm font-medium text-red-700">
            {pageError || "Group not found"}
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

  return (
    <>
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
                {isAdmin && (
                  <button
                    onClick={handleGetInviteLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    <Link2 size={15} />
                    Invite members
                  </button>
                )}
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
                ) : null}
                Join group
              </button>
            )}
          </div>

          {actionError && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {actionError}
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
                <UserAvatar
                  userId={member.user_id}
                  name={member.name}
                  avatarUrl={member.avatar_url}
                  size="md"
                  onClick={
                    member.user_id !== user?.id
                      ? () =>
                          openChat({
                            id: member.user_id,
                            name: member.name,
                            avatar_url: member.avatar_url,
                            university: member.university,
                          })
                      : undefined
                  }
                />
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

      {/* ── Invite link modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowInviteModal(false); setInviteUrl(""); setInviteError(""); setCopied(false); }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
                  <Link2 size={17} />
                </div>
                <h2 className="text-base font-bold text-slate-900">Invite members</h2>
              </div>
              <button
                onClick={() => { setShowInviteModal(false); setInviteUrl(""); setInviteError(""); setCopied(false); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Share this link with anyone you want to invite to{" "}
              <span className="font-semibold text-slate-700">{group?.name}</span>.
              {group?.is_private && (
                <span className="block mt-1 text-xs text-amber-600">
                  This is a private group — only people with this link can join.
                </span>
              )}
            </p>

            {inviteLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Generating link…
              </div>
            ) : inviteError ? (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {inviteError}
              </p>
            ) : inviteUrl ? (
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 truncate focus:outline-none focus:border-teal-400"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
                    copied
                      ? "bg-teal-600 text-white"
                      : "bg-teal-600 hover:bg-teal-500 text-white"
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

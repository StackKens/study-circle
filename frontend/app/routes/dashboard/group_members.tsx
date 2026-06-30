import { useEffect, useState } from "react";
import { Crown, Loader2, Users, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePrivateChat } from "../../context/PrivateChatContext";
import { UserAvatar } from "../../components/UserAvatar";
import type { GroupMember } from "../../types/groupMember";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface GroupMembersProps {
  groupId: string;
  groupName: string;
  currentUserRole: "admin" | "member";
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GroupMembers({
  groupId,
  groupName,
  currentUserRole,
}: GroupMembersProps) {
  const { token, user } = useAuth();
  const { openChat } = usePrivateChat();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = currentUserRole === "admin";
  const adminCount = members.filter((m) => m.role === "admin").length;

  useEffect(() => {
    if (!token) return;

    async function fetchMembers() {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load members");
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load members");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMembers();
  }, [groupId, token]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-lg tracking-tight">
              {groupName}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
              {adminCount} admin{adminCount !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
              <Users size={12} /> Admin
            </span>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="divide-y divide-slate-100">
        {isLoading && (
          <div className="px-5 py-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 size={15} className="animate-spin" />
            Loading members...
          </div>
        )}

        {error && (
          <div className="px-5 py-4 text-sm text-red-600 bg-red-50">
            {error}
          </div>
        )}

        {!isLoading && !error && members.length === 0 && (
          <div className="px-5 py-6 text-sm text-slate-400 text-center">
            No members found.
          </div>
        )}

        {!isLoading && !error && members.map((member) => (
          <div
            key={member.user_id}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
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
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 text-sm">
                    {member.name}
                  </p>
                  {member.role === "admin" && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
                      <Crown size={10} /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {member.course} · Y{member.year_of_study} ·{" "}
                  {member.university} · Joined {formatDate(member.joined_at)}
                </p>
              </div>
            </div>
            {member.user_id !== user?.id && (
              <button
                onClick={() =>
                  openChat({
                    id: member.user_id,
                    name: member.name,
                    avatar_url: member.avatar_url,
                    university: member.university,
                  })
                }
                className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 cursor-pointer"
                title="Send message"
              >
                <MessageCircle size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

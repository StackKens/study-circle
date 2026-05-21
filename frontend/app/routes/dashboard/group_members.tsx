import { useState } from "react";
import { Shield, UserMinus, Crown, Users, LogOut } from "lucide-react";
import type { GroupMember } from "../../types/groupMemeber";

interface GroupMemberWithUser extends GroupMember {
  userName: string;
  userEmail: string;
  userAvatar?: string;
}

interface GroupMembersProps {
  groupId: string;
  groupName: string;
  currentUserId: string;
  currentUserRole: "admin" | "member";
}

const mockMembers: GroupMemberWithUser[] = [
  {
    userId: "1",
    groupId: "g1",
    role: "admin",
    joinedAt: "2026-01-10T00:00:00Z",
    userName: "Alex Mukasa",
    userEmail: "alex@example.com",
  },
  {
    userId: "2",
    groupId: "g1",
    role: "member",
    joinedAt: "2026-01-15T00:00:00Z",
    userName: "Sarah Nakitto",
    userEmail: "sarah@example.com",
  },
  {
    userId: "3",
    groupId: "g1",
    role: "member",
    joinedAt: "2026-02-01T00:00:00Z",
    userName: "Michael Okello",
    userEmail: "michael@example.com",
  },
];

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
  currentUserId,
  currentUserRole,
}: GroupMembersProps) {
  const [members, setMembers] = useState(mockMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const isAdmin = currentUserRole === "admin";
  const adminCount = members.filter((m) => m.role === "admin").length;

  const handlePromote = (userId: string, userName: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === userId ? { ...m, role: "admin" as const } : m,
      ),
    );
    alert(`Promoted ${userName} to admin`);
  };

  const handleRemove = (userId: string, userName: string) => {
    if (userId === currentUserId) {
      alert("You cannot remove yourself. Leave the group instead.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    alert(`Removed ${userName} from the group`);
  };

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      alert(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setShowInvite(false);
    }
  };

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
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Users size={14} /> Invite
            </button>
          )}
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-2.5">
            Invite by email
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="colleague@university.ac.ug"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
            />
            <button
              onClick={handleInvite}
              className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Send
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="border border-slate-200 text-slate-500 hover:bg-slate-100 px-3.5 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="divide-y divide-slate-100">
        {members.map((member) => (
          <div
            key={member.userId}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {member.userName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 text-sm">
                    {member.userName}
                  </p>
                  {member.role === "admin" && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
                      <Crown size={10} /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {member.userEmail} · Joined {formatDate(member.joinedAt)}
                </p>
              </div>
            </div>

            {isAdmin && member.userId !== currentUserId && (
              <div className="flex items-center gap-1">
                {member.role !== "admin" && (
                  <button
                    onClick={() =>
                      handlePromote(member.userId, member.userName)
                    }
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-colors"
                    title="Make admin"
                  >
                    <Shield size={15} />
                  </button>
                )}
                <button
                  onClick={() => handleRemove(member.userId, member.userName)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove member"
                >
                  <UserMinus size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leave group — members only */}
      {!isAdmin && (
        <div className="px-5 py-3.5 border-t border-slate-100">
          <button className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition-colors">
            <LogOut size={14} /> Leave Group
          </button>
        </div>
      )}
    </div>
  );
}

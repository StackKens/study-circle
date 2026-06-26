import GroupChat from "../../components/GroupChat";
import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useGroupStore } from "../../store/groupStore";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { token } = useAuth();
  const { groups, fetchGroups } = useGroupStore();

  useEffect(() => {
    if (token && groups.length === 0) fetchGroups(token);
  }, [token]);

  const group = groups.find((g) => g.id === groupId);

  if (!groupId) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link
        to={`/dashboard/groups/${groupId}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to group
      </Link>
      <div className="h-[600px]">
        <GroupChat groupId={groupId} groupName={group?.name ?? "Group Chat"} />
      </div>
    </div>
  );
}

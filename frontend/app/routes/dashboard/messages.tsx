import { useEffect, useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePrivateChat } from "../../context/PrivateChatContext";
import { UserAvatar } from "../../components/UserAvatar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Conversation {
  id: string;
  content: string;
  created_at: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_university: string;
}

export default function MessagesPage() {
  const { token } = useAuth();
  const { openChat } = usePrivateChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setConversations(d))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Private conversations with classmates and instructors
        </p>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={24} />
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <MessageCircle size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No messages yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Click someone's avatar in chat or visit the Instructors page to start
            a conversation
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {conversations.map((c) => (
            <button
              key={c.other_user_id}
              onClick={() =>
                openChat({
                  id: c.other_user_id,
                  name: c.other_user_name,
                  avatar_url: c.other_user_avatar,
                  university: c.other_user_university,
                })
              }
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <UserAvatar
                userId={c.other_user_id}
                name={c.other_user_name}
                avatarUrl={c.other_user_avatar}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">
                  {c.other_user_name}
                </p>
                <p className="text-xs text-slate-400 truncate">{c.content}</p>
              </div>
              <span className="text-[10px] text-slate-400 flex-shrink-0">
                {new Date(c.created_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

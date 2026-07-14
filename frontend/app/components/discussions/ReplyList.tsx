import { useState } from "react";
import { Loader2, Pencil, Heart } from "lucide-react";
import { UserAvatar } from "../UserAvatar";
import type { Reply } from "./types";
import { formatDateTime } from "./types";

interface ReplyListProps {
  replies: Reply[];
  currentUserId?: string;
  onToggleLike: (replyId: string) => Promise<void>;
  onEditReply?: (replyId: string, content: string) => Promise<void>;
  likingReplyId?: string | null;
}

export function ReplyList({
  replies,
  currentUserId,
  onToggleLike,
  onEditReply,
  likingReplyId,
}: ReplyListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function handleSave(replyId: string) {
    if (!editContent.trim() || savingEdit || !onEditReply) return;
    setSavingEdit(true);
    try {
      await onEditReply(replyId, editContent);
      setEditingId(null);
      setEditContent("");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="divide-y divide-slate-100">
      {replies.map((r) => (
        <div key={r.id} className="px-4 sm:px-5 py-3 hover:bg-slate-50/80 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <UserAvatar
              userId={r.author_id}
              name={r.author_name}
              avatarUrl={r.author_avatar}
              size="sm"
            />
            <span className="text-xs font-medium text-slate-700">
              {r.author_name}
            </span>
            <span className="text-[10px] text-slate-400">
              {formatDateTime(r.created_at)}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => onToggleLike(r.id)}
                disabled={!!likingReplyId}
                className={`flex items-center gap-1 text-xs cursor-pointer transition-colors ${
                  r.liked
                    ? "text-red-500"
                    : "text-slate-400 hover:text-red-400"
                }`}
              >
                <Heart
                  size={12}
                  fill={r.liked ? "currentColor" : "none"}
                />
                {r.like_count > 0 && r.like_count}
              </button>
              {currentUserId === r.author_id &&
                onEditReply &&
                editingId !== r.id && (
                  <button
                    onClick={() => {
                      setEditingId(r.id);
                      setEditContent(r.content);
                    }}
                    className="text-slate-400 hover:text-teal-600 cursor-pointer transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                )}
            </div>
          </div>
          {editingId === r.id ? (
            <div className="ml-8 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none focus:border-teal-400 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(r.id)}
                  disabled={savingEdit || !editContent.trim()}
                  className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : null}
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-slate-500 cursor-pointer hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 ml-8 leading-relaxed">
              {r.content}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

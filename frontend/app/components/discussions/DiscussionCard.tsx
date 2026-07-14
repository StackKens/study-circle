import { Loader2, CheckCircle2, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import type { Discussion, Reply } from "./types";
import { formatDate } from "./types";
import { ReplyForm } from "./ReplyForm";
import { ReplyList } from "./ReplyList";

interface DiscussionCardProps {
  discussion: Discussion;
  expanded: boolean;
  replies?: Reply[];
  loadingReplies: boolean;
  onToggleReplies: () => void;
  onReply: (content: string) => Promise<void>;
  onEditReply?: (replyId: string, content: string) => Promise<void>;
  onToggleLike: (replyId: string) => Promise<void>;
  currentUserId?: string;
  likingReplyId?: string | null;
  showCourse?: boolean;
}

export function DiscussionCard({
  discussion,
  expanded,
  replies,
  loadingReplies,
  onToggleReplies,
  onReply,
  onEditReply,
  onToggleLike,
  currentUserId,
  likingReplyId,
  showCourse,
}: DiscussionCardProps) {
  const d = discussion;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm sm:text-base">
                {d.title}
              </span>
              {d.is_answered && (
                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  <CheckCircle2 size={10} className="sm:w-3 sm:h-3" /> Answered
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-400">
              <span>by {d.author_name}</span>
              {showCourse && d.course_title && (
                <>
                  <span>·</span>
                  <span className="text-teal-600">{d.course_title}</span>
                </>
              )}
              <span>·</span>
              <span>{formatDate(d.created_at)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {d.content}
        </p>

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={onToggleReplies}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 font-medium cursor-pointer transition-colors"
          >
            {loadingReplies ? (
              <Loader2 size={12} className="animate-spin" />
            ) : expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            {d.reply_count}{" "}
            {d.reply_count === 1 ? "reply" : "replies"}
          </button>
        </div>

        {/* Reply form */}
        {expanded && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <ReplyForm onSubmit={onReply} onCancel={onToggleReplies} />
          </div>
        )}
      </div>

      {/* Replies section */}
      {expanded && loadingReplies && (
        <div className="border-t border-slate-100 px-4 sm:px-5 py-4 flex justify-center">
          <Loader2 size={16} className="animate-spin text-teal-600" />
        </div>
      )}

      {expanded && replies && replies.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/30">
          <ReplyList
            replies={replies}
            currentUserId={currentUserId}
            onToggleLike={onToggleLike}
            onEditReply={onEditReply}
            likingReplyId={likingReplyId}
          />
        </div>
      )}

      {expanded && replies && replies.length === 0 && !loadingReplies && (
        <div className="border-t border-slate-100 px-4 sm:px-5 py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <MessageSquare size={12} />
          No replies yet
        </div>
      )}
    </div>
  );
}

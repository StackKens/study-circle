import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { usePrivateChat } from "../context/PrivateChatContext";
import { UserAvatar } from "./UserAvatar";
import { MentionTextarea } from "./MentionTextarea";
import { renderMessageContent } from "../utils/chat";
import { Send, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_university: string;
  sender_avatar_url?: string | null;
  content: string;
  created_at: string;
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupByDay(
  messages: Message[],
): Array<{ label: string; messages: Message[] }> {
  const groups: Array<{ label: string; messages: Message[] }> = [];
  let currentLabel = "";
  for (const msg of messages) {
    const label = formatDateLabel(msg.created_at);
    if (label !== currentLabel) {
      groups.push({ label, messages: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].messages.push(msg);
  }
  return groups;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = [
  "bg-teal-600",
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-green-700",
  "bg-teal-700",
  "bg-emerald-700",
];

const REPLY_AVATAR_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-orange-600",
  "bg-sky-600",
];

function avatarColor(senderId: string, isOwn: boolean): string {
  if (isOwn) {
    let hash = 0;
    for (let i = 0; i < senderId.length; i++) {
      hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return REPLY_AVATAR_COLORS[Math.abs(hash) % REPLY_AVATAR_COLORS.length];
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function MessageBubble({
  msg,
  isOwn,
  ownName,
  ownId,
  onAvatarClick,
}: {
  msg: Message;
  isOwn: boolean;
  ownName: string;
  ownId: string;
  onAvatarClick?: (user: {
    id: string;
    name: string;
    avatar_url?: string | null;
    university?: string;
  }) => void;
}) {
  const handleAvatarClick = () => {
    if (isOwn || !onAvatarClick) return;
    onAvatarClick({
      id: msg.sender_id,
      name: msg.sender_name,
      avatar_url: msg.sender_avatar_url,
      university: msg.sender_university,
    });
  };

  if (isOwn) {
    return (
      <div className="flex gap-1.5 items-end justify-end">
        <div className="flex flex-col items-end gap-px">
          <div className="w-fit max-w-[82%] sm:max-w-[70%] lg:max-w-[60%] bg-teal-600 text-white px-2.5 py-1 rounded-2xl rounded-tr-sm text-sm leading-relaxed break-words">
            {renderMessageContent(msg.content)}
          </div>
          <span className="text-[10px] text-slate-400 pr-0.5">
            {formatTime(msg.created_at)}
          </span>
        </div>
        <UserAvatar
          userId={ownId}
          name={ownName}
          avatarUrl={msg.sender_avatar_url}
          size="sm"
        />
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-start">
      <UserAvatar
        userId={msg.sender_id}
        name={msg.sender_name}
        avatarUrl={msg.sender_avatar_url}
        size="md"
        onClick={handleAvatarClick}
      />
      <div className="flex flex-col gap-px max-w-[82%] sm:max-w-[70%] lg:max-w-[60%]">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-slate-700">
            {msg.sender_name}
          </span>
          <span className="text-[10px] text-slate-400">
            {msg.sender_university}
          </span>
        </div>
        <div className="w-fit bg-white border border-slate-300 text-slate-800 px-2.5 py-1 rounded-2xl rounded-tl-sm text-sm leading-relaxed break-words shadow-sm">
          {renderMessageContent(msg.content)}
        </div>
        <span className="text-[10px] text-slate-400 pl-0.5">
          {formatTime(msg.created_at)}
        </span>
      </div>
    </div>
  );
}

function StatusDot({
  status,
}: {
  status: "connecting" | "connected" | "disconnected" | "error";
}) {
  const map = {
    connecting: { dot: "bg-amber-400 animate-pulse", text: "Connecting…" },
    connected: { dot: "bg-emerald-500", text: "Live" },
    disconnected: { dot: "bg-slate-400", text: "Reconnecting…" },
    error: { dot: "bg-red-500", text: "Error" },
  };
  const { dot, text } = map[status];
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="text-xs text-slate-400">{text}</span>
    </div>
  );
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { user, token } = useAuth();
  const { openChat } = usePrivateChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const prevGroupId = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      socket.emit("join_room", { group_id: groupId });
      prevGroupId.current = groupId;
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));
    socket.on("message_history", (history: Message[]) => setMessages(history));
    socket.on("receive_message", (msg: Message) =>
      setMessages((prev) => [...prev, msg]),
    );
    socket.on("error", (err: { message: string }) =>
      console.error("[chat]", err.message),
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (socketRef.current?.connected && prevGroupId.current !== groupId) {
      setMessages([]);
      socketRef.current.emit("join_room", { group_id: groupId });
      prevGroupId.current = groupId;
    }
  }, [groupId]);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !socketRef.current?.connected) return;
    socketRef.current.emit("send_message", {
      group_id: groupId,
      content: trimmed,
    });
    setInput("");
    inputRef.current?.focus();
  }, [input, groupId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const dayGroups = groupByDay(messages);

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
            <MessageCircle size={15} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">
              {groupName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400">Group chat</p>
              <span className="inline-flex items-center justify-center min-w-[1.375rem] h-[1.375rem] px-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-[11px] font-bold leading-none">
                {messages.length}
              </span>
            </div>
          </div>
        </div>
        <StatusDot status={status} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 lg:px-6 lg:py-4 space-y-1">
        {messages.length === 0 && status === "connected" && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
              <MessageCircle size={22} className="text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">
                No messages yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Be the first to say something
              </p>
            </div>
          </div>
        )}

        {dayGroups.map((group) => (
          <div key={group.label}>
            <DateSeparator label={group.label} />
            <div className="space-y-2">
              {group.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.sender_id === user?.id}
                  ownName={user?.name ?? ""}
                  ownId={user?.id ?? ""}
                  onAvatarClick={openChat}
                />
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 lg:px-6 lg:py-3 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-100 transition-all">
          <MentionTextarea
            inputRef={inputRef}
            value={input}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            placeholder="Message the group… Use @name to tag"
            disabled={status !== "connected"}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed max-h-[120px] disabled:opacity-40 w-full"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || status !== "connected"}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Send message"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

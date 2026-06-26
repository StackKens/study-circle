import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";

// ─── Types

interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_university: string;
  content: string;
  created_at: string;
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

// ─── Helpers

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

/** Group messages by calendar day for date separators */
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

/** Initials avatar from a name */
function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic avatar color from sender_id */
const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
];

function avatarColor(senderId: string): string {
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Sub-components

function Avatar({ name, senderId }: { name: string; senderId: string }) {
  return (
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${avatarColor(senderId)}`}
    >
      {initials(name)}
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-xs text-zinc-500 font-medium tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="max-w-[75%] sm:max-w-[60%] bg-violet-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed break-words">
          {msg.content}
        </div>
        <span className="text-xs text-zinc-500 pr-1">
          {formatTime(msg.created_at)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-end">
      <Avatar name={msg.sender_name} senderId={msg.sender_id} />
      <div className="flex flex-col gap-0.5 max-w-[75%] sm:max-w-[60%]">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-zinc-200">
            {msg.sender_name}
          </span>
          <span className="text-xs text-zinc-500">{msg.sender_university}</span>
        </div>
        <div className="bg-zinc-800 text-zinc-100 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed break-words">
          {msg.content}
        </div>
        <span className="text-xs text-zinc-500 pl-1">
          {formatTime(msg.created_at)}
        </span>
      </div>
    </div>
  );
}

function StatusBar({
  status,
}: {
  status: "connecting" | "connected" | "disconnected" | "error";
}) {
  const map = {
    connecting: { dot: "bg-amber-400 animate-pulse", text: "Connecting…" },
    connected: { dot: "bg-emerald-400", text: "Live" },
    disconnected: { dot: "bg-zinc-500", text: "Reconnecting…" },
    error: { dot: "bg-rose-500", text: "Connection error" },
  };
  const { dot, text } = map[status];
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="text-xs text-zinc-400">{text}</span>
    </div>
  );
}

// ─── Main component

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { user, token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const prevGroupId = useRef<string | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket lifecycle
  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(SERVER_URL, {
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

    socket.on("message_history", (history: Message[]) => {
      setMessages(history);
    });

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("error", (err: { message: string }) => {
      console.error("[chat] server error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Re-join when groupId changes (navigating between group chats)
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

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const dayGroups = groupByDay(messages);

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
      {/* ── Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-violet-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8h2a2 2 0 012 2v9l-4-4H9a2 2 0 01-2-2v-1M3 8a2 2 0 012-2h9a2 2 0 012 2v6a2 2 0 01-2 2H7l-4 4V8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 leading-tight">
              {groupName}
            </h2>
            <p className="text-xs text-zinc-500">Group chat</p>
          </div>
        </div>
        <StatusBar status={status} />
      </div>

      {/* ── Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {messages.length === 0 && status === "connected" && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">
                No messages yet
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Be the first to say something
              </p>
            </div>
          </div>
        )}

        {dayGroups.map((group) => (
          <div key={group.label}>
            <DateSeparator label={group.label} />
            <div className="space-y-3">
              {group.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.sender_id === user?.id}
                />
              ))}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Input */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/40">
        <div className="flex items-end gap-2 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-4 py-2.5 focus-within:border-violet-500/50 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message the group…"
            disabled={status !== "connected"}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none outline-none leading-relaxed max-h-[120px] disabled:opacity-40"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || status !== "connected"}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Send message"
          >
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

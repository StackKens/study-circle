import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePrivateChat } from "../context/PrivateChatContext";
import { UserAvatar } from "./UserAvatar";
import { renderMessageContent } from "../utils/chat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PrivateChatModal() {
  const { user, token } = useAuth();
  const { target, closeChat, isOpen, messages, status, sendMessage } =
    usePrivateChat();
  const [input, setInput] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 2 || !token) {
      setMentionResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(
        `${API_URL}/messages/search?q=${encodeURIComponent(mentionQuery)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setMentionResults(data);
        })
        .catch(() => setMentionResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [mentionQuery, token]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const mentionMatches = trimmed.match(/@([\w\s]+)/g) || [];
    const mentions = mentionResults
      .filter((u) => mentionMatches.some((m) => m.slice(1).trim() === u.name))
      .map((u) => u.id);

    sendMessage(trimmed, mentions);
    setInput("");
    inputRef.current?.focus();
  }, [input, mentionResults, sendMessage]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";

    const atMatch = val.match(/@(\w*)$/);
    setMentionQuery(atMatch ? atMatch[1] : null);
  };

  const insertMention = (name: string) => {
    setInput((prev) => prev.replace(/@\w*$/, `@${name} `));
    setMentionQuery(null);
    setMentionResults([]);
    inputRef.current?.focus();
  };

  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={closeChat}
      />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[520px] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
          <UserAvatar
            userId={target.id}
            name={target.name}
            avatarUrl={target.avatar_url}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">
              {target.name}
            </p>
            {target.university && (
              <p className="text-xs text-slate-400 truncate">
                {target.university}
              </p>
            )}
          </div>
          <button
            onClick={closeChat}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
          {status === "connecting" && (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-teal-600" />
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? "bg-teal-600 text-white rounded-tr-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {renderMessageContent(msg.content)}
                  <p
                    className={`text-[10px] mt-1 ${isOwn ? "text-teal-100" : "text-slate-400"}`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Mention suggestions */}
        {mentionResults.length > 0 && (
          <div className="border-t border-slate-100 bg-white px-3 py-2 max-h-32 overflow-y-auto">
            {mentionResults.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => insertMention(u.name)}
                className="w-full text-left px-2 py-1.5 text-sm text-slate-700 hover:bg-teal-50 rounded-lg cursor-pointer"
              >
                @{u.name}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-slate-100 bg-white">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-100">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${target.name.split(" ")[0]}...`}
              disabled={status !== "connected"}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed max-h-[80px]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || status !== "connected"}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-30 flex items-center justify-center cursor-pointer"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

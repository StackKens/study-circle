import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, ChevronDown, Plus, Trash2, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const coolOpeners = [
  "Ready to ace this course?",
  "Ask me anything, I've got you.",
  "Stuck? Let's figure it out together.",
  "Your study buddy, ready when you are.",
  "Fire away — I'm all ears.",
];

export default function AiCourseChat({ courseId }: { courseId: string }) {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const sessionsRef = useRef<HTMLDivElement>(null);
  const [opener] = useState(
    () => coolOpeners[Math.floor(Math.random() * coolOpeners.length)],
  );
  const firstName = user?.name?.split(" ")[0] || "Student";

  const activeTitle = sessions.find((s) => s.id === activeSessionId)?.title || "AI Assistant";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamingContent]);

  // Close sessions dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sessionsRef.current && !sessionsRef.current.contains(e.target as Node)) {
        setShowSessions(false);
      }
    }
    if (showSessions) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSessions]);

  // Load sessions when opening; auto-create one if none exist
  const loadSessions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: ChatSession[] = await res.json();
      setSessions(data);
      if (data.length > 0) {
        setActiveSessionId((prev) => prev ?? data[0].id);
      } else {
        // Auto-create a session so the input isn't blocked
        const created = await fetch(`${API_URL}/courses/${courseId}/chat/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (created.ok) {
          const session: ChatSession = await created.json();
          setSessions([session]);
          setActiveSessionId(session.id);
        }
      }
    } catch {}
  }, [token, courseId]);

  useEffect(() => {
    if (open && token) {
      setMessages([]);
      setActiveSessionId(null);
      loadSessions();
    }
  }, [open, token, loadSessions]);

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId || !token) return;
    setMessages([]);
    fetch(`${API_URL}/courses/${courseId}/chat/sessions/${activeSessionId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
        }
      })
      .catch(() => {});
  }, [activeSessionId, token, courseId]);

  async function createNewSession() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/chat/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed");
      const session: ChatSession = await res.json();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      setShowSessions(false);
    } catch {}
  }

  async function deleteSession(sid: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/chat/sessions/${sid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      setSessions((prev) => prev.filter((s) => s.id !== sid));
      if (activeSessionId === sid) {
        const remaining = sessions.filter((s) => s.id !== sid);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
        setMessages([]);
      }
    } catch {}
  }

  async function renameSession(sid: string) {
    const newTitle = window.prompt("Rename chat session:");
    if (!newTitle?.trim() || !token) return;
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/chat/sessions/${sid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: ChatSession = await res.json();
      setSessions((prev) => prev.map((s) => (s.id === sid ? updated : s)));
    } catch {}
  }

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loadingRef.current || !token || !activeSessionId) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingContent("");
    loadingRef.current = true;

    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg.content, sessionId: activeSessionId }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.token) {
                  fullContent += parsed.token;
                  setStreamingContent(fullContent);
                }
                if (parsed.done && parsed.title) {
                  // Auto-title update from backend
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId ? { ...s, title: parsed.title } : s,
                    ),
                  );
                }
                if (parsed.error) {
                  fullContent = parsed.error;
                  setStreamingContent(fullContent);
                }
              } catch {}
            }
          }
        }
      }

      if (fullContent) {
        setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
      } else {
        throw new Error("Empty response");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setStreamingContent("");
      loadingRef.current = false;
    }
  }, [input, token, courseId, activeSessionId]);

  return (
    <>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" />
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[85%] h-[55vh] sm:left-auto sm:translate-x-0 sm:right-6 sm:w-[32rem] sm:h-[55vh] z-50 flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200">
            <div className="relative flex items-center justify-between px-4 py-3 bg-teal-600 text-white rounded-t-xl shrink-0">
              <button
                onClick={() => setShowSessions((s) => !s)}
                className="flex items-center gap-1.5 cursor-pointer hover:text-teal-100"
              >
                <Bot size={18} />
                <span className="text-sm font-semibold truncate max-w-[160px] sm:max-w-[200px]">
                  {activeTitle}
                </span>
                <ChevronDown size={14} className={`transition-transform ${showSessions ? "rotate-180" : ""}`} />
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={createNewSession}
                  className="p-1 rounded hover:bg-teal-500 cursor-pointer"
                  title="New Chat"
                >
                  <Plus size={16} />
                </button>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-teal-500 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {messages.length === 0 && !loading && (
                <div className="text-center pt-6">
                  <Bot size={32} className="mx-auto text-teal-300 mb-2" />
                  <p className="text-xs text-slate-500">{opener}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 mt-1">
                      <Bot size={16} className="text-teal-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-teal-600 text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-700 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 mt-1">
                      <User size={16} className="text-teal-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="shrink-0 mt-1">
                    <Bot size={16} className="text-teal-600" />
                  </div>
                  <div className="max-w-[80%] rounded-xl rounded-tl-sm px-3 py-2 bg-slate-100 text-sm text-slate-700">
                    {streamingContent || (
                      <span className="inline-flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Sessions slide-up panel */}
            <AnimatePresence>
              {showSessions && (
                <motion.div
                  ref={sessionsRef}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-200 bg-white"
                >
                  <div className="max-h-40 sm:max-h-48 overflow-y-auto">
                    <button
                      onClick={createNewSession}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-teal-600 hover:bg-teal-50 font-medium border-b border-slate-100 cursor-pointer"
                    >
                      <Plus size={15} />
                      New Chat
                    </button>
                    {sessions.length === 0 && (
                      <p className="px-4 py-3 text-sm text-slate-400 text-center">No chats yet</p>
                    )}
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center gap-1 px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 group ${
                          s.id === activeSessionId ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"
                        }`}
                        onClick={() => { setActiveSessionId(s.id); setShowSessions(false); }}
                      >
                        <span className="flex-1 truncate">{s.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); renameSession(s.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm("Delete this chat?")) deleteSession(s.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              onSubmit={handleSend}
              className="border-t border-slate-200 p-3 flex gap-2 shrink-0 rounded-b-xl"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                disabled={loading || !activeSessionId}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !activeSessionId}
                className="bg-teal-600 text-white p-2 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 left-6 md:right-6 md:left-auto z-50 bg-teal-600 text-white p-3.5 rounded-full shadow-lg hover:bg-teal-500 transition cursor-pointer"
          title={`${firstName}'s AI Assistant`}
        >
          <MessageCircle size={22} />
        </button>
      )}
    </>
  );
}
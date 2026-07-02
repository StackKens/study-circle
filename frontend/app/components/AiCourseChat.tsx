import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [opener] = useState(() => coolOpeners[Math.floor(Math.random() * coolOpeners.length)]);
  const firstName = user?.name?.split(" ")[0] || "Student";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || !token) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg.content, history }),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
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
    }
  }

  return (
    <>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" />
          <div className="fixed bottom-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-50 max-h-[70vh] flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-teal-600 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Bot size={18} />
                <span className="text-sm font-semibold">{firstName}'s AI Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {messages.length === 0 && (
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
                  <div className="max-w-[80%] rounded-xl rounded-tl-sm px-3 py-2 bg-slate-100">
                    <Loader2 size={14} className="animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-slate-200 p-3 flex gap-2 shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-teal-600 text-white p-2 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-24 left-6 z-50 bg-teal-600 text-white p-3.5 rounded-full shadow-lg hover:bg-teal-500 transition cursor-pointer"
        title={`${firstName}'s AI Assistant`}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}

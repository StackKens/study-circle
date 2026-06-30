import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface MentionUser {
  id: string;
  name: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  className = "",
  rows = 1,
  inputRef: externalRef,
}: MentionTextareaProps) {
  const { token } = useAuth();
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = externalRef ?? internalRef;
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);

  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 2 || !token) {
      setMentionResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`${API_URL}/messages/search?q=${encodeURIComponent(mentionQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setMentionResults(data);
        })
        .catch(() => setMentionResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [mentionQuery, token]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    const atMatch = val.match(/@(\w*)$/);
    setMentionQuery(atMatch ? atMatch[1] : null);
  };

  const insertMention = (name: string) => {
    onChange(value.replace(/@\w*$/, `@${name} `));
    setMentionQuery(null);
    setMentionResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 min-w-0">
      <textarea
        ref={inputRef}
        rows={rows}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {mentionResults.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
          {mentionResults.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => insertMention(u.name)}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 cursor-pointer"
            >
              @{u.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

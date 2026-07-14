import { useState } from "react";
import { Loader2, Send } from "lucide-react";

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function ReplyForm({
  onSubmit,
  onCancel,
  placeholder = "Write your reply…",
  compact = false,
}: ReplyFormProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!value.trim() || loading) return;
    setLoading(true);
    try {
      await onSubmit(value);
      setValue("");
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          className="p-2 bg-teal-600 text-white rounded-lg cursor-pointer disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none focus:border-teal-400 transition-colors"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer transition-opacity"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          Reply
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

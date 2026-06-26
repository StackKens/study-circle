import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  X,
  Check,
  Loader2,
  Video,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSessionStore } from "../../store/sessionStore";
import { useGroupStore } from "../../store/groupStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

type SessionStatus = "scheduled" | "ongoing" | "completed";

const statusConfig: Record<SessionStatus, { label: string; classes: string }> =
  {
    scheduled: {
      label: "Upcoming",
      classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    ongoing: {
      label: "Live",
      classes: "bg-amber-50 text-amber-600 border-amber-100",
    },
    completed: {
      label: "Completed",
      classes: "bg-slate-100 text-slate-500 border-slate-200",
    },
  };

function getStatus(start: string, end: string): SessionStatus {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return "scheduled";
  if (now >= s && now <= e) return "ongoing";
  return "completed";
}

export default function SessionsPage() {
  const { token } = useAuth();
  const { sessions, isLoading, fetchSessions, addSession, markSessionJoined } =
    useSessionStore();
  const { groups, fetchGroups } = useGroupStore();

  const [joining, setJoining] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    group_id: "",
    start_time: "",
    end_time: "",
  });

  const adminGroups = groups.filter((g) => g.role === "admin");
  const isAdmin = adminGroups.length > 0;

  useEffect(() => {
    if (!token) return;
    fetchSessions(token);
    if (groups.length === 0) fetchGroups(token);
  }, [token, fetchSessions, fetchGroups]);

  const upcoming = sessions.filter((s) => {
    const status = getStatus(s.start_time, s.end_time);
    return status === "scheduled" || status === "ongoing";
  });

  const past = sessions.filter(
    (s) => getStatus(s.start_time, s.end_time) === "completed",
  );

  const handleCreate = async () => {
    if (
      !formData.title ||
      !formData.group_id ||
      !formData.start_time ||
      !formData.end_time
    ) {
      setError("All fields are required");
      return;
    }
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      setError("End time must be after start time");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session");
      addSession(data);
      setIsModalOpen(false);
      setFormData({ title: "", group_id: "", start_time: "", end_time: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (sessionId: string) => {
    setJoining(sessionId);
    setJoinError("");
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join session");
      markSessionJoined(sessionId, data.participant_count);
    } catch (err) {
      console.error("joinSession error:", err);
      setJoinError(
        err instanceof Error ? err.message : "Failed to join session",
      );
    } finally {
      setJoining(null);
    }
  };

  const getJoinAction = (session: {
    start_time: string;
    end_time: string;
    has_joined?: boolean;
  }) => {
    const status = getStatus(session.start_time, session.end_time);
    if (status === "completed") {
      return { label: "Ended", disabled: true };
    }
    if (session.has_joined) {
      return {
        label: status === "ongoing" ? "Checked in" : "Reserved",
        disabled: true,
      };
    }
    if (status === "ongoing") return { label: "Join now", disabled: false };
    return { label: "Reserve spot", disabled: false };
  };

  const inputClass =
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 bg-white";

  return (
    <div className="max-w-4xl mx-auto px-1">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
            Schedule
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Study Sessions
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Schedule and join study meetings
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center cursor-pointer gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={15} /> Create Session
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Loading...
        </div>
      ) : (
        <>
          {joinError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {joinError}
            </div>
          )}

          {/* Upcoming */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-3">
              Upcoming{" "}
              <span className="text-teal-600 ml-1">{upcoming.length}</span>
            </p>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((session) => {
                  const { date, time } = formatDateTime(session.start_time);
                  const joinAction = getJoinAction(session);
                  const config =
                    statusConfig[
                      getStatus(session.start_time, session.end_time)
                    ];
                  return (
                    <div
                      key={session.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {session.title}
                            </h3>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${config.classes}`}
                            >
                              {config.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} /> {date}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} /> {time}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users size={13} /> {session.participant_count}{" "}
                              attending
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5">
                            {session.group_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {session.meet_link &&
                            getStatus(session.start_time, session.end_time) !==
                              "completed" && (
                              <a
                                href={session.meet_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                              >
                                <Video size={13} /> Join Meet
                              </a>
                            )}
                          <button
                            onClick={() => handleJoin(session.id)}
                            disabled={
                              joining === session.id || joinAction.disabled
                            }
                            className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {joining === session.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              joinAction.label
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-14 bg-white rounded-xl border border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Calendar size={22} className="text-slate-400" />
                </div>
                <p className="font-medium text-slate-700">
                  No upcoming sessions
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Create one to get your group together
                </p>
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-3">
                Past Sessions
              </p>
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
                {past.map((session) => {
                  const { date, time } = formatDateTime(session.start_time);
                  const config =
                    statusConfig[
                      getStatus(session.start_time, session.end_time)
                    ];
                  return (
                    <div
                      key={session.id}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-700 text-sm">
                            {session.title}
                          </p>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.classes}`}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {date} at {time} · {session.group_name}
                        </p>
                      </div>
                      <button className="text-xs text-teal-600 font-semibold hover:text-teal-700 cursor-pointer">
                        View →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                Create Session
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError("");
                }}
                className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Session title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. DSA Group Review"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Study group
                </label>
                <select
                  value={formData.group_id}
                  onChange={(e) =>
                    setFormData({ ...formData, group_id: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Select a group</option>
                  {adminGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {groups.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    No groups yet — create one first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start time
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError("");
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Check size={15} /> Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

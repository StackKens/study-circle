import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Users,
  Calendar,
  FolderOpen,
  Clock,
  PlusCircle,
  BookOpen,
  ArrowRight,
  Loader2,
  GraduationCap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useGroupStore } from "../../store/groupStore";
import { useSessionStore } from "../../store/sessionStore";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface UserStats {
  groups: number;
  sessions: number;
  resources: number;
  studyHours: number;
}

const colorMap: Record<string, string> = {
  teal: "bg-teal-50 text-teal-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
};

const quickActions = [
  { label: "Create Group", icon: PlusCircle, modal: true, color: "teal" },
  {
    label: "Schedule Session",
    icon: Calendar,
    path: "/dashboard/sessions",
    color: "blue",
  },
  {
    label: "Upload Resource",
    icon: FolderOpen,
    path: "/dashboard/resources",
    color: "amber",
  },
  {
    label: "Browse Courses",
    icon: GraduationCap,
    path: "/dashboard/courses",
    color: "teal",
  },
  {
    label: "Find Instructors",
    icon: Users,
    path: "/dashboard/instructors",
    color: "purple",
  },
];

function getStatus(start: string, end: string) {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return "upcoming";
  if (now >= s && now <= e) return "ongoing";
  return "past";
}

function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardHome() {
  const { user, token } = useAuth();
  const { groups, fetchGroups } = useGroupStore();
  const { sessions, fetchSessions, markSessionJoined } = useSessionStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchGroups(token);
    fetchSessions(token);
    fetch(`${API_URL}/users/me/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUserStats(data))
      .catch(console.error);
  }, [token]);

  const upcomingSessions = sessions
    .filter((s) => getStatus(s.start_time, s.end_time) !== "past")
    .slice(0, 3);

  const recentGroups = groups.slice(0, 3);

  async function handleJoinSession(sessionId: string) {
    if (!token) return;

    setJoiningSessionId(sessionId);
    setJoinError("");
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join session");
      markSessionJoined(sessionId, data.participant_count);

      // Auto-open only for live joins; reserving an upcoming session stays here.
      if (data.status === "checked_in" && data.meet_link) {
        window.open(data.meet_link, "_blank", "noopener");
      }
    } catch (err) {
      console.error("joinSession error:", err);
      setJoinError(
        err instanceof Error ? err.message : "Failed to join session",
      );
    } finally {
      setJoiningSessionId(null);
    }
  }

  function getJoinLabel(session: (typeof sessions)[number]) {
    const status = getStatus(session.start_time, session.end_time);
    if (session.has_joined)
      return status === "ongoing" ? "Checked in" : "Reserved";
    return status === "ongoing" ? "Join now" : "Reserve";
  }

  const stats = [
    {
      label: "Active Groups",
      value: groups.length,
      icon: Users,
      change: groups.length > 0 ? `${groups.length} joined` : "None yet",
    },
    {
      label: "Sessions This Week",
      value: upcomingSessions.length,
      icon: Calendar,
      change: upcomingSessions.length > 0 ? "Upcoming" : "None scheduled",
    },
    {
      label: "Resources Shared",
      value: userStats?.resources ?? "—",
      icon: FolderOpen,
      change: userStats ? `${userStats.resources} uploaded` : "Loading...",
    },
    {
      label: "Study Hours",
      value: userStats ? `${userStats.studyHours}h` : "—",
      icon: Clock,
      change: userStats ? `${userStats.studyHours}h total` : "Loading...",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-1">
      <div className="mb-8">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Overview
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.name || "Guest"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here's what's happening in your study circle
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                <stat.icon size={17} className="text-slate-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            <p className="text-[11px] text-emerald-600 mt-2 font-medium">
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-700 mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) =>
            "modal" in action && action.modal ? (
              <button
                key={action.label}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all w-full text-left cursor-pointer"
              >
                <div
                  className={`w-9 h-9 ${colorMap[action.color]} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <action.icon size={17} />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {action.label}
                </span>
              </button>
            ) : (
              <Link
                key={action.label}
                to={action.path!}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div
                  className={`w-9 h-9 ${colorMap[action.color]} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <action.icon size={17} />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {action.label}
                </span>
              </Link>
            ),
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Groups */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-slate-900">Your Study Groups</p>
              <Link
                to="/dashboard/groups"
                className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {recentGroups.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentGroups.map((group) => (
                  <div
                    key={group.id}
                    className="py-3.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {group.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {group.total_members} member
                        {group.total_members !== 1 ? "s" : ""} · {group.subject}
                      </p>
                    </div>
                    <Link
                      to="/dashboard/groups"
                      className="text-xs text-teal-600 font-medium hover:text-teal-700"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">
                No groups yet — create one to get started.
              </p>
            )}
          </div>

          {/* Sessions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-slate-900">Upcoming Sessions</p>
              <Link
                to="/dashboard/sessions"
                className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-1">
                {joinError && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {joinError}
                  </p>
                )}
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {session.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatSessionTime(session.start_time)} ·{" "}
                        {session.participant_count} attending
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinSession(session.id)}
                      disabled={
                        joiningSessionId === session.id || session.has_joined
                      }
                      className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {joiningSessionId === session.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        getJoinLabel(session)
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">
                No upcoming sessions — schedule one from your groups.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* Study Tip */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <BookOpen size={16} className="text-teal-600" />
              <p className="font-semibold text-slate-800 text-sm">Study Tip</p>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Break sessions into 50-minute blocks with 10-minute breaks. The
              Pomodoro technique keeps you sharp and consistent.
            </p>
          </div>
        </div>
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Users,
  Calendar,
  FolderOpen,
  Clock,
  BookOpen,
  ArrowRight,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
  enrolledCourses: number;
}

const colorMap: Record<string, string> = {
  teal: "bg-teal-50 text-teal-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
};

const quickActions = [
  { label: "Create Group", icon: Users, modal: true, color: "teal" },
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
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["user-stats", user?.id],
    queryFn: () =>
      fetch(`${API_URL}/users/me/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) return;
    fetchGroups(token);
    fetchSessions(token);
  }, [token]);

  const upcomingSessions = sessions
    .filter((s) => getStatus(s.start_time, s.end_time) !== "past")
    .slice(0, 3);

  const recentGroups = groups.slice(0, 3);

  async function handleJoinSession(sessionId: string, meetLink?: string) {
    if (!token) return;

    setJoiningSessionId(sessionId);
    setJoinError("");

    if (meetLink) {
      window.open(meetLink, "_blank", "noopener");
    }

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
      label: "Enrolled Courses",
      value: userStats?.enrolledCourses ?? "—",
      icon: GraduationCap,
      change: userStats
        ? userStats.enrolledCourses > 0
          ? `${userStats.enrolledCourses} active`
          : "None yet"
        : "···",
    },
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
      change: userStats ? `${userStats.resources} uploaded` : "···",
    },
    {
      label: "Study Hours",
      value: userStats ? `${userStats.studyHours}h` : "—",
      icon: Clock,
      change: userStats ? `${userStats.studyHours}h total` : "···",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Overview
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "Guest"}
        </h1>
        <p className="text-slate-500 text-sm mt-1 hidden sm:block">
          Here's what's happening in your study circle
        </p>
      </div>

      {/* KPI Stats — 2-col on mobile, 3-col on md, 5-col on lg */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-5 sm:mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5"
          >
            {/* Mobile: icon + value side by side; desktop: stacked */}
            <div className="flex items-center gap-2 sm:block">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 sm:mb-3">
                <stat.icon size={15} className="text-slate-600 sm:hidden" />
                <stat.icon size={17} className="text-slate-600 hidden sm:block" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {stat.value}
              </p>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-tight">
              {stat.label}
            </p>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 mt-1 font-medium hidden sm:block">
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions — horizontal scrollable row on mobile, grid on sm+ */}
      <div className="mb-5 sm:mb-8">
        <p className="text-sm font-semibold text-slate-700 mb-3">
          Quick Actions
        </p>
        {/* Mobile: scrollable horizontal pill row */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden scrollbar-none">
          {quickActions.map((action) =>
            "modal" in action && action.modal ? (
              <button
                key={action.label}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className={`w-7 h-7 ${colorMap[action.color]} rounded-lg flex items-center justify-center`}
                >
                  <action.icon size={14} />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {action.label}
                </span>
              </button>
            ) : (
              <Link
                key={action.label}
                to={action.path!}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 whitespace-nowrap shrink-0 active:scale-95 transition-transform"
              >
                <div
                  className={`w-7 h-7 ${colorMap[action.color]} rounded-lg flex items-center justify-center`}
                >
                  <action.icon size={14} />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {action.label}
                </span>
              </Link>
            ),
          )}
        </div>
        {/* Desktop: 2-col then 4-col grid */}
        <div className="hidden sm:grid grid-cols-3 lg:grid-cols-5 gap-3">
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
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Groups */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="font-semibold text-slate-900 text-sm sm:text-base">
                Your Study Groups
              </p>
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
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {group.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {group.total_members} member
                        {group.total_members !== 1 ? "s" : ""} · {group.subject}
                      </p>
                    </div>
                    <Link
                      to="/dashboard/groups"
                      className="text-xs text-teal-600 font-medium hover:text-teal-700 shrink-0"
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
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="font-semibold text-slate-900 text-sm sm:text-base">
                Upcoming Sessions
              </p>
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
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-2">
                    {joinError}
                  </p>
                )}
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2.5 px-2 sm:px-3 rounded-lg hover:bg-slate-50 transition-colors gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatSessionTime(session.start_time)} ·{" "}
                        {session.participant_count} attending
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinSession(session.id, session.meet_link)}
                      disabled={
                        joiningSessionId === session.id || session.has_joined
                      }
                      className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
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

        <div className="space-y-4 sm:space-y-5">
          {/* Study Tip */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={15} className="text-teal-600" />
              <p className="font-semibold text-slate-800 text-sm">Study Tip</p>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
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

import { useEffect, useState, useRef } from "react";
import {
  Users,
  Calendar,
  FolderOpen,
  TrendingUp,
  Sparkles,
  Loader2,
  ArrowRight,
  BookOpen,
  Clock,
  Target,
  Zap,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface GroupProgress {
  id: string;
  name: string;
  subject: string;
  university: string;
  role: "admin" | "member";
  member_count: number;
  session_count: number;
  resource_count: number;
  last_session: string | null;
}

interface GroupRecommendation {
  id: string;
  name: string;
  subject: string;
  university: string;
  total_members: number;
  score: number;
  reason: string;
}

interface UserStats {
  groups: number;
  sessions: number;
  resources: number;
  studyHours: number;
}

interface UpcomingSession {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  group_name: string;
  group_id: string;
  participant_count: number;
  has_joined: boolean;
}

interface RecentActivity {
  type: "session" | "resource" | "join";
  group_name: string;
  group_id: string;
  title: string;
  timestamp: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "No sessions yet";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSessionTime(iso: string) {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return isToday
    ? `Today at ${time}`
    : `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${time}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

function getEngagementLevel(
  sessions: number,
  resources: number,
  members: number,
): { label: string; percent: number; color: string } {
  const score = sessions * 3 + resources * 2 + members;
  if (score >= 20)
    return { label: "Very Active", percent: 90, color: "bg-emerald-500" };
  if (score >= 10)
    return { label: "Active", percent: 65, color: "bg-teal-500" };
  if (score >= 5)
    return { label: "Moderate", percent: 40, color: "bg-amber-500" };
  return { label: "Quiet", percent: 20, color: "bg-slate-400" };
}

export default function ProgressPage() {
  const { token } = useAuth();
  const [groups, setGroups] = useState<GroupProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<GroupRecommendation[]>(
    [],
  );
  const [recsLoading, setRecsLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>(
    [],
  );
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);

    Promise.all([
      fetch(`${API_URL}/users/me/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/users/me/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/sessions/recent-activity`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([progressData, statsData, sessionsData, activityData]) => {
        if (Array.isArray(progressData)) setGroups(progressData);
        if (statsData && typeof statsData === "object" && "groups" in statsData)
          setUserStats(statsData);
        if (Array.isArray(sessionsData)) {
          const now = new Date();
          const upcoming = sessionsData.filter(
            (s: any) => new Date(s.end_time) > now,
          );
          setUpcomingSessions(upcoming.slice(0, 5));
        }
        if (Array.isArray(activityData)) setRecentActivity(activityData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  const pendingRecs = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!token || groups.length > 0 || isLoading) return;
    if (pendingRecs.current) return;
    setRecsLoading(true);
    pendingRecs.current = fetch(`${API_URL}/groups/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRecommendations(data);
      })
      .catch(console.error)
      .finally(() => {
        setRecsLoading(false);
        pendingRecs.current = null;
      });
  }, [token, groups.length, isLoading]);

  async function handleJoin(groupId: string) {
    if (!token) return;
    setJoiningId(groupId);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok)
        setRecommendations((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      console.error("joinGroup error:", err);
    } finally {
      setJoiningId(null);
    }
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );

  const hasGroups = groups.length > 0;
  const totalMembers = groups.reduce(
    (sum, g) => sum + Number(g.member_count),
    0,
  );
  const totalSessions = groups.reduce(
    (sum, g) => sum + Number(g.session_count),
    0,
  );

  return (
    <div className="max-w-5xl mx-auto px-1">
      <div className="mb-8">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Progress
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Your Study Journey
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Activity overview across all your study groups
        </p>
      </div>

      {/* ── Overall Stats Bar ── */}
      {userStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              icon: Users,
              value: userStats.groups,
              label: "Groups",
              color: "text-teal-600",
              bg: "bg-teal-50",
            },
            {
              icon: Calendar,
              value: userStats.sessions,
              label: "Sessions",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: FolderOpen,
              value: userStats.resources,
              label: "Resources Shared",
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              icon: Clock,
              value: `${userStats.studyHours}h`,
              label: "Study Hours",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 leading-none">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasGroups ? (
        <>
          {/* ── Group Progress Cards ── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">
                Group Progress
              </p>
              <span className="text-xs text-slate-400">
                {groups.length} group{groups.length !== 1 ? "s" : ""} ·{" "}
                {totalMembers} total members
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const engagement = getEngagementLevel(
                  Number(group.session_count),
                  Number(group.resource_count),
                  Number(group.member_count),
                );
                const sessionPercent = Math.min(
                  100,
                  Number(group.session_count) * 16,
                );
                const resourcePercent = Math.min(
                  100,
                  Number(group.resource_count) * 14,
                );

                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 leading-snug">
                          {group.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {group.subject} · {group.university}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          group.role === "admin"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {group.role}
                      </span>
                    </div>

                    {/* Engagement level */}
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={13} className="text-slate-400" />
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${engagement.color} transition-all duration-700`}
                          style={{ width: `${engagement.percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {engagement.label}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2.5 bg-slate-50 rounded-lg">
                        <Users
                          size={14}
                          className="text-teal-600 mx-auto mb-0.5"
                        />
                        <p className="text-sm font-bold text-slate-900">
                          {group.member_count}
                        </p>
                        <p className="text-[10px] text-slate-400">Members</p>
                      </div>
                      <div className="text-center p-2.5 bg-slate-50 rounded-lg">
                        <Calendar
                          size={14}
                          className="text-blue-500 mx-auto mb-0.5"
                        />
                        <p className="text-sm font-bold text-slate-900">
                          {group.session_count}
                        </p>
                        <p className="text-[10px] text-slate-400">Sessions</p>
                      </div>
                      <div className="text-center p-2.5 bg-slate-50 rounded-lg">
                        <FolderOpen
                          size={14}
                          className="text-purple-500 mx-auto mb-0.5"
                        />
                        <p className="text-sm font-bold text-slate-900">
                          {group.resource_count}
                        </p>
                        <p className="text-[10px] text-slate-400">Resources</p>
                      </div>
                    </div>

                    {/* Session progress bar */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Sessions</span>
                        <span className="text-slate-600 font-medium">
                          {group.session_count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-700"
                          style={{ width: `${sessionPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Resources</span>
                        <span className="text-slate-600 font-medium">
                          {group.resource_count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-700"
                          style={{ width: `${resourcePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        Last session —{" "}
                        <span className="text-slate-600 font-medium">
                          {formatDate(group.last_session)}
                        </span>
                      </p>
                      <Link
                        to={`/dashboard/groups/${group.id}`}
                        className="text-xs text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                      >
                        Open →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Bottom Grid: Upcoming Sessions + Recent Activity ── */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Upcoming sessions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">
                  Upcoming Sessions
                </p>
                {upcomingSessions.length > 0 && (
                  <Link
                    to="/dashboard/sessions"
                    className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
                  >
                    View all <ArrowRight size={11} />
                  </Link>
                )}
              </div>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-2">
                  {upcomingSessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {s.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatSessionTime(s.start_time)} ·{" "}
                          {s.participant_count} attending
                        </p>
                        <p className="text-xs text-slate-400">{s.group_name}</p>
                      </div>
                      <Link
                        to={`/dashboard/groups/${s.group_id}`}
                        className="text-xs text-teal-600 font-semibold hover:text-teal-700 shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar size={20} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No upcoming sessions</p>
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">
                  Recent Activity
                </p>
              </div>
              {recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.slice(0, 8).map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          a.type === "session"
                            ? "bg-blue-50 text-blue-500"
                            : a.type === "resource"
                              ? "bg-purple-50 text-purple-500"
                              : "bg-teal-50 text-teal-500"
                        }`}
                      >
                        {a.type === "session" ? (
                          <Calendar size={13} />
                        ) : a.type === "resource" ? (
                          <FolderOpen size={13} />
                        ) : (
                          <Users size={13} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">
                          {a.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {a.group_name} · {timeAgo(a.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock size={20} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No recent activity</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Join a session or share a resource to get started
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Study Tip ── */}
          <div className="mt-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm mb-1">
                Study Smarter
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Groups with regular sessions show 3× better progress. Try
                scheduling at least one session per week per group to keep
                momentum going.
              </p>
            </div>
          </div>
        </>
      ) : (
        // ── Empty State ──
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800 text-base mb-1">
              No progress to show yet
            </p>
            <p className="text-sm text-slate-400 max-w-sm">
              You're not part of any study group. Join one below to start
              tracking sessions, resources, and activity.
            </p>
          </div>

          {/* Recommended groups */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    Suggested Groups to Join
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Matched to your course and university
                  </p>
                </div>
              </div>
              <Link
                to="/dashboard/groups"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors shrink-0"
              >
                See all <ArrowRight size={12} />
              </Link>
            </div>

            {recsLoading ? (
              <div className="py-8 flex items-center justify-center text-sm text-slate-400 gap-2">
                <Loader2 size={16} className="animate-spin" /> Finding groups
                for you...
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {recommendations.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-lg border border-slate-200 p-4 bg-slate-50/60"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm leading-snug">
                          {group.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {group.subject} · {group.university}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md shrink-0">
                        {group.score}% match
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                      {group.reason}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users size={11} /> {group.total_members} members
                      </span>
                      <button
                        onClick={() => handleJoin(group.id)}
                        disabled={joiningId === group.id}
                        className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {joiningId === group.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          "Join"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 mb-3">
                  No recommendations available right now.
                </p>
                <Link
                  to="/dashboard/groups"
                  className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Browse all groups →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

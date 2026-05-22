import { useState } from "react";
import { Link } from "react-router";
import {
  Users,
  Calendar,
  FolderOpen,
  Clock,
  PlusCircle,
  BookOpen,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";

// Mock data – will be replaced with real data later
const stats = [
  { label: "Active Groups", value: "4", icon: Users, change: "+2 this month" },
  {
    label: "Sessions This Week",
    value: "3",
    icon: Calendar,
    change: "+1 vs last week",
  },
  {
    label: "Resources Shared",
    value: "52",
    icon: FolderOpen,
    change: "+12 this month",
  },
  {
    label: "Study Hours",
    value: "47",
    icon: Clock,
    change: "+8 hrs this week",
  },
];

const recentGroups = [
  {
    id: "g1",
    name: "Data Structures & Algorithms",
    members: 12,
    nextSession: "Today, 4PM",
  },
  {
    id: "g2",
    name: "Database Systems",
    members: 8,
    nextSession: "Tomorrow, 2PM",
  },
  { id: "g3", name: "Web Development", members: 15, nextSession: "Wed, 10AM" },
];

const upcomingSessions = [
  {
    id: "s1",
    title: "DSA Group Review",
    time: "Today, 4:00 PM",
    group: "Data Structures",
    attendees: 6,
  },
  {
    id: "s2",
    title: "Database Project Meeting",
    time: "Tomorrow, 2:00 PM",
    group: "Database Systems",
    attendees: 4,
  },
  {
    id: "s3",
    title: "Web Dev Study Group",
    time: "Wed, 10:00 AM",
    group: "Web Development",
    attendees: 9,
  },
];

const activities = [
  {
    user: "Michael Okello",
    action: "uploaded",
    item: "Database Notes.pdf",
    time: "2h ago",
  },
  {
    user: "Aisha Namubiru",
    action: "scheduled",
    item: "Web Dev Session",
    time: "5h ago",
  },
  {
    user: "John Muwanga",
    action: "commented",
    item: "On DSA assignment",
    time: "yesterday",
  },
  {
    user: "Grace Asiimwe",
    action: "joined",
    item: "Data Structures Group",
    time: "yesterday",
  },
];

const recommendedGroups = [
  {
    id: "rec1",
    name: "Machine Learning Study Circle",
    subject: "CS 450",
    university: "Makerere University",
    match: "89% match",
  },
  {
    id: "rec2",
    name: "UI/UX Design Group",
    subject: "CSC 310",
    university: "Victoria University",
    match: "76% match",
  },
  {
    id: "rec3",
    name: "Competitive Programming",
    subject: "CS 301",
    university: "Kyambogo University",
    match: "94% match",
  },
];

const colorMap: Record<string, string> = {
  teal: "bg-teal-50 text-teal-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
};

// Quick actions – "Create Group" uses modal, others use navigation
const quickActions = [
  { label: "Create Group", icon: PlusCircle, modal: true, color: "teal" },
  {
    label: "Schedule Session",
    icon: Calendar,
    path: "/dashboard/sessions/new",
    color: "blue",
  },
  {
    label: "Upload Resource",
    icon: FolderOpen,
    path: "/dashboard/resources/upload",
    color: "amber",
  },
  {
    label: "Find Friends",
    icon: Users,
    path: "/dashboard/friends",
    color: "purple",
  },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
          {quickActions.map((action) => {
            if ("modal" in action && action.modal) {
              return (
                <button
                  key={action.label}
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300  cursor-pointer  hover:shadow-sm transition-all w-full text-left"
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
              );
            } else {
              return (
                <Link
                  key={action.label}
                  to={action.path!}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
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
              );
            }
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">
            Recommended for You
          </p>
          <span className="text-[11px] text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full font-medium border border-teal-100">
            AI Picks
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {recommendedGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-200 transition-colors"
            >
              <p className="font-semibold text-slate-900 text-sm leading-snug">
                {group.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {group.subject} · {group.university}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-teal-600">
                  {group.match}
                </span>
                <button className="text-xs text-slate-500 hover:text-teal-600 font-medium transition-colors">
                  Join →
                </button>
              </div>
            </div>
          ))}
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
                      {group.members} members · Next: {group.nextSession}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/groups/${group.id}`}
                    className="text-xs text-teal-600 font-medium hover:text-teal-700"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
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
            <div className="space-y-1">
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
                      {session.time} · {session.attendees} attending
                    </p>
                  </div>
                  <button className="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="font-semibold text-slate-900 mb-4">Recent Activity</p>
            <div className="space-y-4">
              {activities.map((act, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
                    {act.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">
                      <span className="font-medium text-slate-900">
                        {act.user}
                      </span>{" "}
                      {act.action}{" "}
                      <span className="text-teal-600 font-medium">
                        {act.item}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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

      {/* Group creation modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
}

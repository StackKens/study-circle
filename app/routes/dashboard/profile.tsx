import { useState } from "react";
import {
  BookOpen,
  Users,
  Clock,
  Award,
  Edit3,
  Camera,
  Mail,
  MapPin,
  GraduationCap,
} from "lucide-react";

const mockUser = {
  name: "Sarah Nakitto",
  email: "sarah@example.com",
  university: "Makerere University",
  course: "BSc Computer Science",
  year: "Year 3",
  bio: "Passionate about algorithms and building things with code. Always looking for focused study partners.",
  joinedAt: "2026-01-05T00:00:00Z",
  stats: {
    groups: 4,
    sessions: 23,
    studyHours: 147,
    resources: 18,
  },
  badges: [
    {
      label: "Top Contributor",
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "Study Streak 7d",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "Resource Star",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
  ],
  recentGroups: [
    {
      id: "g1",
      name: "Data Structures & Algorithms",
      subject: "CS 301",
      members: 12,
    },
    { id: "g2", name: "Database Systems", subject: "CS 250", members: 8 },
    { id: "g3", name: "Web Development", subject: "CS 380", members: 15 },
  ],
};

function formatJoined(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const [user] = useState(mockUser);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user.bio);

  return (
    <div className="max-w-3xl mx-auto px-1">
      <div className="mb-8">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Account
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Profile
        </h1>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <button className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-600 transition-colors shadow-sm">
              <Camera size={11} />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-lg tracking-tight">
                  {user.name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail size={12} /> {user.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin size={12} /> {user.university}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <GraduationCap size={12} /> {user.course} · {user.year}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-1.5 border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              >
                <Edit3 size={12} /> Edit
              </button>
            </div>

            {/* Bio */}
            <div className="mt-4">
              {editing ? (
                <div className="space-y-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 resize-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setBio(user.bio);
                        setEditing(false);
                      }}
                      className="border border-slate-200 text-slate-500 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed">{bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Member since */}
        <p className="text-xs text-slate-400 mt-5 pt-5 border-t border-slate-100">
          Member since {formatJoined(user.joinedAt)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          {
            icon: Users,
            value: user.stats.groups,
            label: "Groups",
            color: "text-teal-600",
            bg: "bg-teal-50",
          },
          {
            icon: BookOpen,
            value: user.stats.sessions,
            label: "Sessions",
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            icon: Clock,
            value: `${user.stats.studyHours}h`,
            label: "Study Hours",
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            icon: Award,
            value: user.stats.resources,
            label: "Resources",
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
        ].map(({ icon: Icon, value, label, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 p-4 text-center"
          >
            <div
              className={`w-9 h-9 ${bg} ${color} rounded-lg flex items-center justify-center mx-auto mb-2`}
            >
              <Icon size={16} />
            </div>
            <p className="text-xl font-bold text-slate-900 tracking-tight">
              {value}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-3">
          Badges
        </p>
        <div className="flex flex-wrap gap-2">
          {user.badges.map((badge) => (
            <span
              key={badge.label}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${badge.color}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">
            Active Groups
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {user.recentGroups.map((group) => (
            <div
              key={group.id}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-900 text-sm">
                  {group.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {group.subject} · {group.members} members
                </p>
              </div>
              <button className="text-xs text-teal-600 font-semibold hover:text-teal-700">
                View →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

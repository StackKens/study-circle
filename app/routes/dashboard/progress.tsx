import { useState } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
} from "lucide-react";

// Types for group progress data
interface GroupProgress {
  groupId: string;
  groupName: string;
  subject: string;
  totalMembers: number;
  averageProgress: number;
  completedTopics: number;
  totalTopics: number;
  studyHoursThisWeek: number;
  lastActiveAt: string;
  membersByProgress: {
    excellent: number;
    good: number;
    atRisk: number;
  };
  topicProgress: {
    topicId: string;
    topicName: string;
    completedCount: number;
    totalMembers: number;
    completionRate: number;
  }[];
  recentActivity: {
    userId: string;
    userName: string;
    action: string;
    timestamp: string;
  }[];
}

// Mock data for group progress
const mockGroupProgress: GroupProgress[] = [
  {
    groupId: "g1",
    groupName: "Data Structures & Algorithms",
    subject: "CS 301",
    totalMembers: 12,
    averageProgress: 75,
    completedTopics: 5,
    totalTopics: 8,
    studyHoursThisWeek: 48,
    lastActiveAt: "2026-05-17T16:00:00Z",
    membersByProgress: {
      excellent: 5,
      good: 4,
      atRisk: 3,
    },
    topicProgress: [
      {
        topicId: "t1",
        topicName: "Arrays & Hashing",
        completedCount: 12,
        totalMembers: 12,
        completionRate: 100,
      },
      {
        topicId: "t2",
        topicName: "Two Pointers",
        completedCount: 10,
        totalMembers: 12,
        completionRate: 83,
      },
      {
        topicId: "t3",
        topicName: "Sliding Window",
        completedCount: 9,
        totalMembers: 12,
        completionRate: 75,
      },
      {
        topicId: "t4",
        topicName: "Stack & Queue",
        completedCount: 7,
        totalMembers: 12,
        completionRate: 58,
      },
      {
        topicId: "t5",
        topicName: "Binary Search",
        completedCount: 6,
        totalMembers: 12,
        completionRate: 50,
      },
      {
        topicId: "t6",
        topicName: "Backtracking",
        completedCount: 4,
        totalMembers: 12,
        completionRate: 33,
      },
      {
        topicId: "t7",
        topicName: "Dynamic Programming",
        completedCount: 3,
        totalMembers: 12,
        completionRate: 25,
      },
    ],
    recentActivity: [
      {
        userId: "u1",
        userName: "Alice",
        action: "completed Stack & Queue",
        timestamp: "2026-05-17T10:00:00Z",
      },
      {
        userId: "u2",
        userName: "Bob",
        action: "uploaded recursion notes",
        timestamp: "2026-05-16T15:30:00Z",
      },
      {
        userId: "u3",
        userName: "Carol",
        action: "scored 85% on quiz",
        timestamp: "2026-05-16T09:00:00Z",
      },
    ],
  },
  {
    groupId: "g2",
    groupName: "Database Systems",
    subject: "CS 250",
    totalMembers: 8,
    averageProgress: 52,
    completedTopics: 3,
    totalTopics: 7,
    studyHoursThisWeek: 22,
    lastActiveAt: "2026-05-17T14:30:00Z",
    membersByProgress: {
      excellent: 2,
      good: 3,
      atRisk: 3,
    },
    topicProgress: [
      {
        topicId: "db1",
        topicName: "SQL Basics",
        completedCount: 8,
        totalMembers: 8,
        completionRate: 100,
      },
      {
        topicId: "db2",
        topicName: "Joins & Subqueries",
        completedCount: 6,
        totalMembers: 8,
        completionRate: 75,
      },
      {
        topicId: "db3",
        topicName: "Normalization",
        completedCount: 4,
        totalMembers: 8,
        completionRate: 50,
      },
      {
        topicId: "db4",
        topicName: "Transactions",
        completedCount: 3,
        totalMembers: 8,
        completionRate: 38,
      },
      {
        topicId: "db5",
        topicName: "Indexing",
        completedCount: 2,
        totalMembers: 8,
        completionRate: 25,
      },
    ],
    recentActivity: [
      {
        userId: "u4",
        userName: "David",
        action: "submitted group project",
        timestamp: "2026-05-17T12:00:00Z",
      },
      {
        userId: "u5",
        userName: "Eve",
        action: "asked about joins",
        timestamp: "2026-05-16T20:00:00Z",
      },
    ],
  },
];

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProgressPage() {
  const [groupProgress] = useState(mockGroupProgress);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Group Progress</h1>
        <p className="text-slate-500 text-sm mt-1">
          Track your study groups' collective performance
        </p>
      </div>

      {groupProgress.map((group) => (
        <div
          key={group.groupId}
          className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {group.groupName}
                </h2>
                <p className="text-sm text-slate-500">
                  {group.subject} • {group.totalMembers} members
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                <TrendingUp size={16} className="text-teal-600" />
                <span className="font-semibold text-slate-800">
                  {group.averageProgress}%
                </span>
                <span className="text-xs text-slate-500">avg progress</span>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-teal-50 rounded-xl">
                <CheckCircle size={20} className="text-teal-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800">
                  {group.completedTopics}/{group.totalTopics}
                </p>
                <p className="text-xs text-slate-500">Topics completed</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <Clock size={20} className="text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800">
                  {group.studyHoursThisWeek}
                </p>
                <p className="text-xs text-slate-500">
                  Study hours (this week)
                </p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-xl">
                <Award size={20} className="text-amber-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800">
                  {group.membersByProgress.excellent}
                </p>
                <p className="text-xs text-slate-500">Top performers</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <BarChart3 size={20} className="text-purple-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800">
                  {group.membersByProgress.atRisk}
                </p>
                <p className="text-xs text-slate-500">Need support</p>
              </div>
            </div>

            {/* Topic Completion Breakdown */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">
                Topic Completion
              </h3>
              <div className="space-y-3">
                {group.topicProgress.map((topic) => (
                  <div key={topic.topicId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{topic.topicName}</span>
                      <span className="text-slate-500">
                        {topic.completedCount}/{topic.totalMembers} members
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${topic.completionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Members Progress Distribution */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">
                Member Progress Distribution
              </h3>
              <div className="flex h-4 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500"
                  style={{
                    width: `${(group.membersByProgress.excellent / group.totalMembers) * 100}%`,
                  }}
                  title="Excellent"
                />
                <div
                  className="bg-amber-500"
                  style={{
                    width: `${(group.membersByProgress.good / group.totalMembers) * 100}%`,
                  }}
                  title="Good"
                />
                <div
                  className="bg-red-500"
                  style={{
                    width: `${(group.membersByProgress.atRisk / group.totalMembers) * 100}%`,
                  }}
                  title="At Risk"
                />
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />{" "}
                  Excellent ({group.membersByProgress.excellent})
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" /> Good (
                  {group.membersByProgress.good})
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full" /> At Risk (
                  {group.membersByProgress.atRisk})
                </span>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">
                Recent Group Activity
              </h3>
              <div className="space-y-2">
                {group.recentActivity.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {act.userName.charAt(0)}
                    </div>
                    <div>
                      <p>
                        <span className="font-medium text-slate-700">
                          {act.userName}
                        </span>{" "}
                        {act.action}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(act.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {groupProgress.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No groups to track progress yet.</p>
        </div>
      )}
    </div>
  );
}

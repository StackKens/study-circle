import { useState } from "react";
import { Users, Calendar, Plus, ArrowRight } from "lucide-react";
import type { Group } from "../../types/group";

const mockGroups: Group[] = [
  {
    id: "1",
    name: "Data Structures & Algorithms",
    description:
      "Weekly problem-solving sessions, LeetCode prep, and exam revision for CS301.",
    subject: "CS 301",
    university: "Makerere University",
    createdBy: "user1",
    totalMembers: 12,
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "2",
    name: "Database Systems",
    description:
      "Group project collaboration, normalization practice, and SQL queries help.",
    subject: "CS 250",
    university: "Makerere University",
    createdBy: "user2",
    totalMembers: 8,
    createdAt: "2026-02-01T10:30:00Z",
  },
  {
    id: "3",
    name: "Web Development",
    description:
      "Building full-stack projects together – React, Node.js, and MongoDB.",
    subject: "CS 380",
    university: "Victoria University",
    createdBy: "user3",
    totalMembers: 15,
    createdAt: "2026-03-10T14:00:00Z",
  },
  {
    id: "4",
    name: "Machine Learning Basics",
    description:
      "Hands-on ML with Python, scikit-learn, and Kaggle competitions.",
    subject: "CS 450",
    university: "Kyambogo University",
    createdBy: "user4",
    totalMembers: 6,
    createdAt: "2026-04-05T09:00:00Z",
  },
];

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GroupsPage() {
  const [groups] = useState(mockGroups);

  return (
    <div className="max-w-5xl mx-auto px-1">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
            Workspace
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Study Groups
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and explore your study circles
          </p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
          <Plus size={15} /> Create Group
        </button>
      </div>

      {groups.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 leading-snug">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {group.subject} · {group.university}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                  <Users size={11} /> {group.totalMembers}
                </div>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
                {group.description}
              </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar size={11} /> {formatDate(group.createdAt)}
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium">
                    Resources
                  </button>
                  <button className="text-sm text-teal-600 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all">
                    Open <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users size={22} className="text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No groups yet</p>
          <p className="text-sm text-slate-400 mb-5">
            Create a group or explore ones to join
          </p>
          <button className="text-sm text-teal-600 font-semibold">
            Explore groups →
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Calendar, Clock, Users, Plus } from "lucide-react";
import type { Session } from "~/types/session";

const mockSessions: Session[] = [
  {
    id: "1",
    groupId: "g1",
    title: "DSA Group Review",
    startTime: "2026-05-18T16:00:00Z",
    endTime: "2026-05-18T18:00:00Z",
    attendees: ["user1", "user2", "user3", "user4", "user5", "user6"],
    participants: 6,
    createdAt: "2026-05-10T10:00:00Z",
    status: "scheduled",
  },
  {
    id: "2",
    groupId: "g2",
    title: "Database Project Meeting",
    startTime: "2026-05-19T14:00:00Z",
    endTime: "2026-05-19T16:00:00Z",
    attendees: ["user1", "user2", "user3", "user4"],
    participants: 4,
    createdAt: "2026-05-12T09:00:00Z",
    status: "scheduled",
  },
  {
    id: "3",
    groupId: "g3",
    title: "Web Dev Study Group",
    startTime: "2026-05-20T10:00:00Z",
    endTime: "2026-05-20T12:00:00Z",
    attendees: [
      "user1",
      "user2",
      "user3",
      "user4",
      "user5",
      "user6",
      "user7",
      "user8",
      "user9",
    ],
    participants: 9,
    createdAt: "2026-05-14T15:00:00Z",
    status: "scheduled",
  },
  {
    id: "4",
    groupId: "g1",
    title: "DSA Quiz Prep",
    startTime: "2026-05-16T10:00:00Z",
    endTime: "2026-05-16T12:00:00Z",
    attendees: ["user1", "user2", "user5"],
    participants: 3,
    createdAt: "2026-05-01T08:00:00Z",
    status: "completed",
  },
];

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  return {
    date: date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

const statusConfig = {
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
  cancelled: {
    label: "Cancelled",
    classes: "bg-red-50 text-red-500 border-red-100",
  },
};

export default function SessionsPage() {
  const [sessions] = useState(mockSessions);

  const upcoming = sessions.filter(
    (s) => s.status === "scheduled" || s.status === "ongoing",
  );
  const past = sessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled",
  );

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
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
          <Plus size={15} /> Create Session
        </button>
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-3">
          Upcoming <span className="text-teal-600 ml-1">{upcoming.length}</span>
        </p>

        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((session) => {
              const { date, time } = formatDateTime(session.startTime);
              const config =
                statusConfig[session.status as keyof typeof statusConfig];
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
                          <Users size={13} /> {session.participants} attending
                        </span>
                      </div>
                    </div>
                    <button className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors">
                      Join
                    </button>
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
            <p className="font-medium text-slate-700">No upcoming sessions</p>
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
              const { date, time } = formatDateTime(session.startTime);
              const config =
                statusConfig[session.status as keyof typeof statusConfig];
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
                      {date} at {time} · {session.participants} attended
                    </p>
                  </div>
                  <button className="text-xs text-teal-600 font-semibold hover:text-teal-700">
                    View →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Calendar, Clock, Users, Plus, X, Check } from "lucide-react";
import type { Session } from "../../types/session";

const mockSessions: Session[] = [
  // ... your existing mock data ...
];

function formatDateTime(isoString: string) {
  // ... unchanged ...
}

const statusConfig = {
  // ... unchanged ...
};

// Mock groups for the group dropdown (would come from API later)
const mockGroups = [
  { id: "g1", name: "Data Structures & Algorithms" },
  { id: "g2", name: "Database Systems" },
  { id: "g3", name: "Web Development" },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState(mockSessions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    groupId: "",
    startTime: "",
    endTime: "",
  });

  const upcoming = sessions.filter(
    (s) => s.status === "scheduled" || s.status === "ongoing",
  );
  const past = sessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled",
  );

  const handleCreateSession = () => {
    if (
      !formData.title ||
      !formData.groupId ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert("Please fill all fields");
      return;
    }

    const newSession: Session = {
      id: Date.now().toString(),
      group_id: formData.groupId,
      title: formData.title,
      start_time: new Date(formData.startTime).toISOString(),
      end_time: new Date(formData.endTime).toISOString(),
      participant_count: 0,
      created_at: new Date().toISOString(),
      status: "scheduled",
    };

    setSessions([newSession, ...sessions]);
    setIsModalOpen(false);
    setFormData({ title: "", groupId: "", startTime: "", endTime: "" });
  };

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
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={15} /> Create Session
        </button>
      </div>

      {/* Upcoming section - unchanged */}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                Create New Session
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. DSA Group Review"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Study Group
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) =>
                    setFormData({ ...formData, groupId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 bg-white"
                >
                  <option value="">Select group</option>
                  {mockGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Check size={16} /> Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

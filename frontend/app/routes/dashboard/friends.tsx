import { useState } from "react";
import {
  UserPlus,
  UserCheck,
  UserMinus,
  Search,
  MessageCircle,
  X,
  Check,
} from "lucide-react";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  mutualGroups: number;
  since: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  createdAt: string;
}

// Mock data
const mockFriends: Friend[] = [
  {
    id: "2",
    name: "Michael Okello",
    email: "michael@example.com",
    mutualGroups: 2,
    since: "2026-04-10T00:00:00Z",
  },
  {
    id: "3",
    name: "Aisha Namubiru",
    email: "aisha@example.com",
    mutualGroups: 3,
    since: "2026-04-15T00:00:00Z",
  },
  {
    id: "4",
    name: "John Muwanga",
    email: "john@example.com",
    mutualGroups: 1,
    since: "2026-05-01T00:00:00Z",
  },
];

const mockRequests: FriendRequest[] = [
  {
    id: "req1",
    fromUserId: "5",
    fromUserName: "Grace Asiimwe",
    fromUserEmail: "grace@example.com",
    createdAt: "2026-05-17T10:00:00Z",
  },
  {
    id: "req2",
    fromUserId: "6",
    fromUserName: "Peter Ochieng",
    fromUserEmail: "peter@example.com",
    createdAt: "2026-05-16T15:30:00Z",
  },
];

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function FriendsPage() {
  const [friends] = useState(mockFriends);
  const [requests, setRequests] = useState(mockRequests);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAcceptRequest = (requestId: string, fromUserName: string) => {
    // API call comming soon
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    // Also would add to friends list
    alert(`Accepted request from ${fromUserName}`);
  };

  const handleDeclineRequest = (requestId: string, fromUserName: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    alert(`Declined request from ${fromUserName}`);
  };

  const handleRemoveFriend = (friendName: string) => {
    alert(`Remove ${friendName} from friends? (API call)`);
  };

  const handleMessageFriend = (friendName: string) => {
    alert(`Start chat with ${friendName}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Friends</h1>
        <p className="text-slate-500 text-sm mt-1">
          Connect with classmates and study partners
        </p>
      </div>

      {/* Search & Add Friend */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search friends by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus size={16} /> Add Friend
        </button>
      </div>

      {/* Pending Friend Requests */}
      {requests.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-slate-700 mb-3">
            Friend Requests ({requests.length})
          </h2>
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium flex-shrink-0">
                    {req.fromUserName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {req.fromUserName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {req.fromUserEmail}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleAcceptRequest(req.id, req.fromUserName)
                    }
                    className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() =>
                      handleDeclineRequest(req.id, req.fromUserName)
                    }
                    className="flex items-center gap-1 border border-slate-200 text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">
          All Friends ({filteredFriends.length})
        </h2>
        <div className="space-y-2">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold flex-shrink-0">
                  {friend.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{friend.name}</p>
                  <p className="text-xs text-slate-400">
                    {friend.mutualGroups} mutual group
                    {friend.mutualGroups !== 1 ? "s" : ""} • Friend since{" "}
                    {formatDate(friend.since)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMessageFriend(friend.name)}
                  className="p-1.5 text-slate-500 hover:text-teal-600 transition-colors"
                  title="Message"
                >
                  <MessageCircle size={16} />
                </button>
                <button
                  onClick={() => handleRemoveFriend(friend.name)}
                  className="p-1.5 text-slate-500 hover:text-red-600 transition-colors"
                  title="Remove friend"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredFriends.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <UserPlus size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">
              {searchQuery
                ? "No friends match your search."
                : "No friends yet. Add classmates to get started!"}
            </p>
            {!searchQuery && (
              <button className="mt-3 text-teal-600 text-sm font-medium">
                Find friends →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

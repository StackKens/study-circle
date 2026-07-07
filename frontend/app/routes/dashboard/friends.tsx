import { useEffect, useState, useCallback } from "react";
import {
  UserMinus, Search, X, Check, Loader2, Users, Sparkles, RefreshCw, MessageCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePrivateChat } from "../../context/PrivateChatContext";
import { UserAvatar } from "../../components/UserAvatar";
import { getOptimizedAvatarUrl } from "../../utils/cloudinary";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Friend {
  id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  since: string;
  mutual_groups: number;
  avatar_url?: string;
}

interface FriendRequest {
  from_user_id: string;
  from_user_name: string;
  from_user_email: string;
  university: string;
  created_at: string;
  avatar_url?: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  friendship_status: "pending" | "accepted" | "declined" | null;
  avatar_url?: string;
}

interface FriendRecommendation {
  id: string;
  name: string;
  university: string;
  course: string;
  year_of_study: number;
  mutual_groups: number;
  score: number;
  reason: string;
}

function Avatar({ name, url, size = 9 }: { name: string; url?: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-semibold`;
  return url
    ? <img src={getOptimizedAvatarUrl(url) ?? url} alt={name} loading="lazy" decoding="async" className={`${cls} object-cover`} />
    : <div className={`${cls} bg-teal-600 text-white`}>{name.charAt(0)}</div>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function FriendsPage() {
  const { token } = useAuth();
  const { openChat } = usePrivateChat();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<FriendRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchFriends = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/friends`, { headers }),
        fetch(`${API_URL}/friends/requests`, { headers }),
      ]);
      const [friendsData, requestsData] = await Promise.all([
        friendsRes.json(), requestsRes.json(),
      ]);
      if (Array.isArray(friendsData)) setFriends(friendsData);
      if (Array.isArray(requestsData)) setRequests(requestsData);
    } catch (err) {
      console.error("fetchFriends error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchFriends();
  }, [token, fetchFriends]);

  const fetchRecommendations = useCallback(async () => {
    if (!token) return;
    setRecommendationsLoading(true);
    try {
      const res = await fetch(`${API_URL}/friends/recommendations`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setRecommendations(data);
    } catch (err) {
      console.error("fetchRecommendations error:", err);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchRecommendations();
  }, [token, fetchRecommendations]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_URL}/friends/search?q=${encodeURIComponent(searchQuery)}`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) setSearchResults(data);
      } catch (err) {
        console.error("search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const handleSendRequest = async (userId: string, fromRecommendation = false) => {
    setLoadingId(userId);
    try {
      await fetch(`${API_URL}/friends/request/${userId}`, { method: "POST", headers });
      if (fromRecommendation) {
        setRecommendations((prev) => prev.filter((u) => u.id !== userId));
      } else {
        setSearchResults((prev) =>
          prev.map((u) => u.id === userId ? { ...u, friendship_status: "pending" } : u)
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleAccept = async (fromId: string) => {
    setLoadingId(fromId);
    try {
      await fetch(`${API_URL}/friends/request/${fromId}/accept`, { method: "PATCH", headers });
      setRequests((prev) => prev.filter((r) => r.from_user_id !== fromId));
      fetchFriends();
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (fromId: string) => {
    setLoadingId(fromId);
    try {
      await fetch(`${API_URL}/friends/request/${fromId}/decline`, { method: "PATCH", headers });
      setRequests((prev) => prev.filter((r) => r.from_user_id !== fromId));
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (friendId: string) => {
    setLoadingId(friendId);
    try {
      await fetch(`${API_URL}/friends/${friendId}`, { method: "DELETE", headers });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } finally {
      setLoadingId(null);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showSearch = searchQuery.length >= 2;

  return (
    <div className="max-w-4xl mx-auto px-1">
      <div className="mb-8">
        <p className="text-xs text-slate-400 tracking-[0.14em] uppercase font-medium mb-1">
          Network
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Friends</h1>
        <p className="text-slate-500 text-sm mt-1">Connect with classmates and study partners</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email to add friends…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition-all"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Search Results */}
      {showSearch && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] px-5 py-3 border-b border-slate-100">
            Search Results
          </p>
          {isSearching ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No users found</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchResults.map((user) => (
                <div key={user.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} url={user.avatar_url} />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.university} · {user.course}</p>
                    </div>
                  </div>
                  {user.friendship_status === "accepted" ? (
                    <span className="text-xs text-teal-600 font-medium">Friends</span>
                  ) : user.friendship_status === "pending" ? (
                    <span className="text-xs text-slate-400 font-medium">Pending</span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      disabled={loadingId === user.id}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {loadingId === user.id ? <Loader2 size={12} className="animate-spin" /> : <>Add</>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested People */}
      {!showSearch && (
        <section className="mb-6 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Suggested People</p>
                <p className="text-sm text-slate-500 mt-0.5">Students matched to your course and study activity</p>
              </div>
            </div>
            <button
              onClick={fetchRecommendations}
              disabled={recommendationsLoading}
              className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 disabled:opacity-60 flex items-center justify-center transition-colors"
              title="Refresh suggestions"
            >
              {recommendationsLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
          </div>

          {recommendationsLoading ? (
            <div className="py-8 flex items-center justify-center text-sm text-slate-400 gap-2">
              <Loader2 size={16} className="animate-spin" /> Finding matches...
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {recommendations.map((person) => (
                <div key={person.id} className="rounded-lg border border-slate-200 p-4 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={person.name} />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{person.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{person.course} · {person.university}</p>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md shrink-0">
                      {person.score}% match
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mt-3">{person.reason}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400">
                      {person.mutual_groups > 0 ? `${person.mutual_groups} mutual group${person.mutual_groups !== 1 ? "s" : ""}` : `Year ${person.year_of_study}`}
                    </span>
                    <button
                      onClick={() => handleSendRequest(person.id, true)}
                      disabled={loadingId === person.id}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loadingId === person.id ? <Loader2 size={12} className="animate-spin" /> : <>Add</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-5 text-center">No suggestions yet. Join more groups to get better matches.</p>
          )}
        </section>
      )}

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-3">
            Friend Requests <span className="text-teal-600 ml-1">{requests.length}</span>
          </p>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.from_user_id} className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={req.from_user_name} url={req.avatar_url} />
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{req.from_user_name}</p>
                    <p className="text-xs text-slate-400">{req.university} · {formatDate(req.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.from_user_id)}
                    disabled={loadingId === req.from_user_id}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {loadingId === req.from_user_id ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} /> Accept</>}
                  </button>
                  <button
                    onClick={() => handleDecline(req.from_user_id)}
                    disabled={loadingId === req.from_user_id}
                    className="flex items-center gap-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X size={12} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      {!showSearch && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-3">
            Friends <span className="text-teal-600 ml-1">{friends.length}</span>
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-100 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                  </div>
                  <div className="w-20 h-8 bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredFriends.length > 0 ? (
            <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
              {filteredFriends.map((friend) => (
                <div key={friend.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      userId={friend.id}
                      name={friend.name}
                      avatarUrl={friend.avatar_url}
                      size="md"
                      onClick={() =>
                        openChat({
                          id: friend.id,
                          name: friend.name,
                          avatar_url: friend.avatar_url,
                          university: friend.university,
                        })
                      }
                    />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{friend.name}</p>
                      <p className="text-xs text-slate-400">
                        {friend.university} · {Number(friend.mutual_groups)} mutual group{Number(friend.mutual_groups) !== 1 ? "s" : ""} · Since {formatDate(friend.since)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        openChat({
                          id: friend.id,
                          name: friend.name,
                          avatar_url: friend.avatar_url,
                          university: friend.university,
                        })
                      }
                      className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 cursor-pointer"
                      title="Message"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                    onClick={() => handleRemove(friend.id)}
                    disabled={loadingId === friend.id}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Remove friend"
                  >
                    {loadingId === friend.id ? <Loader2 size={15} className="animate-spin" /> : <UserMinus size={15} />}
                  </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users size={22} className="text-slate-400" />
              </div>
              <p className="font-medium text-slate-700 mb-1">No friends yet</p>
              <p className="text-sm text-slate-400">Search for classmates above to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

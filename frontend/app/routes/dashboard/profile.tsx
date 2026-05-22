import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  Mail,
  MapPin,
  GraduationCap,
  Edit3,
  Users,
  BookOpen,
  Clock,
  Award,
  Camera,
  Loader2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const CLOUDINARY_CLOUD = "db0oxbeck";
const CLOUDINARY_PRESET = "p3mbqg5a";

async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: form },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
}

// Define types for the data we fetch
interface UserStats {
  groups: number;
  sessions: number;
  studyHours: number;
  resources: number;
}

interface RecentGroup {
  id: string;
  name: string;
  subject: string;
  memberCount: number;
}

interface Badge {
  label: string;
  color: string;
}

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [bio, setBio] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentGroups, setRecentGroups] = useState<RecentGroup[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data (stats, groups, badges)
  useEffect(() => {
    if (!user || !token) return;
    const fetchProfileData = async () => {
      try {
        const [statsRes, groupsRes, badgesRes] = await Promise.all([
          fetch(`${API_URL}/users/me/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users/me/groups?limit=3`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users/me/badges`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const statsData: UserStats = await statsRes.json();
        const groupsData: RecentGroup[] = await groupsRes.json();
        const badgesData: Badge[] = await badgesRes.json();
        setStats(statsData);
        setRecentGroups(groupsData);
        setBadges(badgesData);
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user, token]);

  // Fetch bio separately
  useEffect(() => {
    if (user?.id && token) {
      fetch(`${API_URL}/users/${user.id}/bio`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data: { bio?: string }) => setBio(data.bio || ""))
        .catch(() => setBio(""));
    }
  }, [user, token]);

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (!user) return <div className="p-4">Please log in</div>;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const avatar_url = await uploadToCloudinary(file);
      await fetch(`${API_URL}/users/${user.id}/avatar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url }),
      });
      updateUser({ avatar_url });
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-1">
      {/* Identity card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-full overflow-hidden group"
              title="Change profile photo"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover "
                />
              ) : (
                <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? (
                  <Loader2 size={18} className="text-white animate-spin" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </div>
            </button>
          </div>
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
                    <GraduationCap size={12} /> {user.course} · Year{" "}
                    {user.year_of_study}
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
                      onClick={async () => {
                        await fetch(`${API_URL}/users/${user.id}/bio`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ bio }),
                        });
                        setEditing(false);
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="border border-slate-200 text-slate-500 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed">
                  {bio || "No bio yet. Click edit to add one."}
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-5 pt-5 border-t border-slate-100">
          Member since{" "}
          {new Date(user.created_at).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              icon: Users,
              value: stats.groups,
              label: "Groups",
              color: "text-teal-600",
              bg: "bg-teal-50",
            },
            {
              icon: BookOpen,
              value: stats.sessions,
              label: "Sessions",
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              icon: Clock,
              value: `${stats.studyHours}h`,
              label: "Study Hours",
              color: "text-amber-500",
              bg: "bg-amber-50",
            },
            {
              icon: Award,
              value: stats.resources,
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
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-3">
            Badges
          </p>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${badge.color}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent groups */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">
            Active Groups
          </p>
        </div>
        {recentGroups.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentGroups.map((group) => (
              <div
                key={group.id}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900 text-sm">{group.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {group.subject} · {group.memberCount} members
                  </p>
                </div>
                <Link
                  to={`/dashboard/groups?focus=${group.id}`}
                  className="text-xs text-teal-600 font-semibold cursor-pointer hover:text-teal-700"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <Users size={20} className="text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 text-sm mb-1">No active groups yet</p>
            <p className="text-xs text-slate-400 mb-4">Join or create a study group to start collaborating with peers.</p>
            <Link
              to="/dashboard/groups"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Browse Groups →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

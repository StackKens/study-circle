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
  FileText,
  Megaphone,
  MessageSquare,
  ExternalLink,
  FolderOpen,
  X,
  ChevronRight,
} from "lucide-react";
import { getOptimizedAvatarUrl, uploadToCloudinary } from "../../utils/cloudinary";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

interface Course {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  university: string;
  created_at: string;
  student_count: number;
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  university: string;
  course_id: string;
  course_title: string;
  enrolled_at: string;
}

interface CourseResource {
  id: string;
  course_id: string;
  course_title: string;
  title: string;
  type: string;
  url: string;
  uploaded_by: string;
  uploaded_by_name: string;
  is_public: boolean;
  created_at: string;
}

interface ActivityItem {
  type: "announcement" | "submission" | "discussion";
  label: string;
  created_at: string;
  course_title: string;
}

type ModalType = "students" | "lessons" | "resources" | null;

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [bio, setBio] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentGroups, setRecentGroups] = useState<RecentGroup[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [instructorStats, setInstructorStats] = useState<{
    courses: number;
    total_students: number;
    follower_count: number;
    resource_count: number;
  } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [allResources, setAllResources] = useState<CourseResource[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data (stats, groups, badges)
  useEffect(() => {
    if (!user || !token) return;
    const fetchProfileData = async () => {
      try {
        if (user.role === "instructor") {
          const [dashRes, groupsRes] = await Promise.all([
            fetch(`${API_URL}/instructors/dashboard`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/users/me/groups?limit=3`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          const dashData = await dashRes.json();
          const groupsData: RecentGroup[] = await groupsRes.json();
          setInstructorStats({
            courses: dashData.courses?.length ?? 0,
            total_students: dashData.total_students ?? 0,
            follower_count: dashData.follower_count ?? 0,
            resource_count: dashData.resource_count ?? 0,
          });
          setCourses(dashData.courses ?? []);
          setRecentActivity(dashData.recent_activity ?? []);
          setRecentGroups(groupsData);
          setLoading(false);
          return;
        }
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
      if (user.role === "instructor" && user.instructor_bio) {
        setBio(user.instructor_bio);
        setLoading(false);
        return;
      }
      fetch(`${API_URL}/users/${user.id}/bio`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data: { bio?: string }) => setBio(data.bio || ""))
        .catch(() => setBio(""));
    }
  }, [user, token]);

  if (loading)
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-5 p-2">
        {/* Avatar + name block */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full" />
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-4 bg-slate-100 rounded-full w-1/3" />
            <div className="h-3 bg-slate-100 rounded-full w-1/2" />
          </div>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="h-5 bg-slate-100 rounded-full w-1/2 mx-auto mb-2" />
              <div className="h-3 bg-slate-100 rounded-full w-2/3 mx-auto" />
            </div>
          ))}
        </div>
        {/* Bio block */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
          <div className="h-3 bg-slate-100 rounded-full w-1/4 mb-3" />
          <div className="h-3 bg-slate-100 rounded-full w-full" />
          <div className="h-3 bg-slate-100 rounded-full w-5/6" />
          <div className="h-3 bg-slate-100 rounded-full w-3/4" />
        </div>
      </div>
    );
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

  const openModal = async (type: ModalType) => {
    setActiveModal(type);
    if (type === "students") {
      setModalLoading(true);
      try {
        const res = await fetch(`${API_URL}/instructors/me/enrolled-students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setEnrolledStudents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setModalLoading(false);
      }
    } else if (type === "resources") {
      setModalLoading(true);
      try {
        const res = await fetch(`${API_URL}/instructors/me/resources`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setAllResources(data);
      } catch (err) {
        console.error(err);
      } finally {
        setModalLoading(false);
      }
    }
  };

  const closeModal = () => setActiveModal(null);

  return (
    <div className="max-w-4xl mx-auto px-1">
      {/* Identity card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className="flex flex-col items-center sm:items-start flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden group cursor-pointer"
              title="Change profile photo"
            >
              {user.avatar_url ? (
                <img
                  src={getOptimizedAvatarUrl(user.avatar_url) ?? user.avatar_url}
                  alt={user.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white text-3xl font-bold">
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
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              {avatarUploading ? "Uploading…" : "Tap to change"}
            </p>
          </div>

          {/* Name + meta + bio */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 text-xl tracking-tight leading-tight">
                  {user.name}
                </h2>
                {user.role === "instructor" && (
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                    Instructor
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail size={12} className="shrink-0" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={12} className="shrink-0" /> {user.university}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <GraduationCap size={12} className="shrink-0" />{" "}
                    {user.role === "instructor"
                      ? user.department || user.course
                      : `${user.course} · Year ${user.year_of_study}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-1.5 border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 cursor-pointer"
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
                        const res = await fetch(`${API_URL}/users/${user.id}/bio`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ bio }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.user) updateUser(data.user);
                          else updateUser({ instructor_bio: bio });
                        }
                        setEditing(false);
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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

        <p className="text-xs text-slate-400 mt-5 pt-4 border-t border-slate-100">
          Member since{" "}
          {new Date(user.created_at).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Two-column layout on large screens */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-5 space-y-5 lg:space-y-0">

        {/* LEFT COLUMN — stats + badges */}
        <div className="space-y-5">

      {/* Stats grid */}
      {user.role === "instructor" && instructorStats ? (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, value: instructorStats.total_students, label: "Students", color: "text-blue-500", bg: "bg-blue-50", key: "students" as ModalType },
            { icon: BookOpen, value: instructorStats.courses, label: "Lessons", color: "text-teal-600", bg: "bg-teal-50", key: "lessons" as ModalType },
            { icon: FolderOpen, value: instructorStats.resource_count, label: "Resources", color: "text-amber-500", bg: "bg-amber-50", key: "resources" as ModalType },
          ].map(({ icon: Icon, value, label, color, bg, key }) => (
            <button
              key={label}
              onClick={() => openModal(key)}
              className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className={`w-9 h-9 ${bg} ${color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </button>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
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
      ) : null}

      {/* Course List — instructors only */}
      {user.role === "instructor" && courses.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">
              My Courses
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/dashboard/instructor/courses/${course.id}`}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {course.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {course.code && `${course.code} · `}{course.student_count} student{course.student_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <ExternalLink size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity — instructors only */}
      {user.role === "instructor" && recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">
              Recent Activity
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity.map((item, i) => {
              const iconMap = {
                announcement: Megaphone,
                submission: FileText,
                discussion: MessageSquare,
              } as const;
              const Icon = iconMap[item.type] || MessageSquare;
              return (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={13} className="text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 leading-snug">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.course_title} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges — students only */}
      {user.role !== "instructor" && badges.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
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

        </div>{/* end LEFT COLUMN */}

        {/* RIGHT COLUMN — groups + courses/activity */}
        <div className="lg:col-span-2 space-y-5">

      {/* Active groups */}
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

        </div>{/* end RIGHT COLUMN */}
      </div>{/* end two-column grid */}

      {/* ── Students Modal ── */}
      {activeModal === "students" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 sm:pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Enrolled Students</h2>
                <p className="text-xs text-slate-400 mt-0.5">{instructorStats?.total_students ?? 0} across {courses.length} course{courses.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {modalLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-teal-600" />
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No enrolled students yet</p>
                </div>
              ) : (
                (() => {
                  const grouped: Record<string, EnrolledStudent[]> = {};
                  enrolledStudents.forEach((s) => {
                    if (!grouped[s.course_title]) grouped[s.course_title] = [];
                    grouped[s.course_title].push(s);
                  });
                  return Object.entries(grouped).map(([courseTitle, students]) => (
                    <div key={courseTitle} className="mb-4 last:mb-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BookOpen size={12} /> {courseTitle}
                        <span className="text-slate-300 font-normal">· {students.length}</span>
                      </p>
                      <div className="space-y-1">
                        {students.map((s) => (
                          <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                              <p className="text-xs text-slate-400 truncate">{s.email}</p>
                            </div>
                            <span className="text-[11px] text-slate-400 shrink-0 ml-2">{s.university}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Lessons Modal ── */}
      {activeModal === "lessons" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 sm:pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Lessons</h2>
                <p className="text-xs text-slate-400 mt-0.5">{courses.length} course{courses.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {courses.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No courses yet</p>
                </div>
              ) : (
                courses.map((c) => (
                  <Link
                    key={c.id}
                    to={`/dashboard/instructor/courses/${c.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>{c.code || "No code"}</span>
                        <span>{c.student_count} student{c.student_count !== 1 ? "s" : ""}</span>
                      </p>
                    </div>
                    <ChevronRight size={15} className="text-slate-300 group-hover:text-teal-500 transition-colors shrink-0 ml-2" />
                  </Link>
                ))
              )}
              {courses.length > 0 && (
                <Link
                  to="/dashboard/instructor/courses"
                  className="block text-center text-xs font-semibold text-teal-600 py-2 hover:text-teal-700 transition-colors"
                >
                  Manage all courses →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Resources Modal ── */}
      {activeModal === "resources" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 sm:pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Course Resources</h2>
                <p className="text-xs text-slate-400 mt-0.5">{allResources.length} resource{allResources.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {modalLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-teal-600" />
                </div>
              ) : allResources.length === 0 ? (
                <div className="text-center py-10">
                  <FolderOpen size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No resources uploaded yet</p>
                </div>
              ) : (
                allResources.map((r) => {
                  const typeCfg: Record<string, { bg: string; text: string }> = {
                    pdf:      { bg: "bg-red-50",    text: "text-red-600" },
                    slides:   { bg: "bg-orange-50", text: "text-orange-600" },
                    document: { bg: "bg-teal-50",   text: "text-teal-600" },
                    link:     { bg: "bg-blue-50",   text: "text-blue-600" },
                  };
                  const cfg = typeCfg[r.type] ?? { bg: "bg-slate-50", text: "text-slate-600" };
                  return (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize shrink-0 ${cfg.bg} ${cfg.text}`}>{r.type}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                          <p className="text-xs text-slate-400 truncate">{r.course_title}</p>
                        </div>
                      </div>
                      <ExternalLink size={13} className="text-slate-300 group-hover:text-teal-500 transition-colors shrink-0 ml-2" />
                    </a>
                  );
                })
              )}
              {allResources.length > 0 && (
                <Link
                  to="/dashboard/instructor/resources"
                  className="block text-center text-xs font-semibold text-teal-600 py-2 hover:text-teal-700 transition-colors"
                >
                  Manage all resources →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

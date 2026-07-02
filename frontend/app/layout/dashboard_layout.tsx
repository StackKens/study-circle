import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router";
import { io, Socket } from "socket.io-client";
import { ProtectedRoute } from "../components/ProtectedRote";
import { useAuth } from "../context/AuthContext";
import { useChatStore } from "../store/chatStore";
import { useNotificationStore } from "../store/notificationStore";
import { PrivateChatProvider } from "../context/PrivateChatContext";
import PrivateChatModal from "../components/PrivateChatModal";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

import {
  LayoutDashboard,
  Users,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  FolderOpen,
  TrendingUp,
  UserPlus,
  Book,
  Bell,
  MessageCircle,
  Calendar as CalendarIcon,
  FileText,
  UserPlus as UserPlusIcon,
  Sparkles,
  Megaphone,
  ClipboardList,
  GraduationCap,
  Mail,
  CheckCheck,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

const notifIconMap: Record<string, { icon: any; bg: string; text: string }> = {
  session: { icon: CalendarIcon, bg: "bg-blue-50", text: "text-blue-500" },
  resource: { icon: FileText, bg: "bg-teal-50", text: "text-teal-600" },
  friend_request: {
    icon: UserPlusIcon,
    bg: "bg-amber-50",
    text: "text-amber-500",
  },
  group_recommendation: {
    icon: Sparkles,
    bg: "bg-purple-50",
    text: "text-purple-500",
  },
  group: { icon: Users, bg: "bg-indigo-50", text: "text-indigo-500" },
  course: { icon: GraduationCap, bg: "bg-teal-50", text: "text-teal-600" },
  course_announcement: { icon: Megaphone, bg: "bg-orange-50", text: "text-orange-500" },
  course_assignment: { icon: ClipboardList, bg: "bg-rose-50", text: "text-rose-500" },
  course_discussion: { icon: MessageCircle, bg: "bg-sky-50", text: "text-sky-500" },
  course_resource: { icon: FolderOpen, bg: "bg-teal-50", text: "text-teal-600" },
  private_message: { icon: Mail, bg: "bg-blue-50", text: "text-blue-500" },
  assignment_graded: { icon: CheckCheck, bg: "bg-emerald-50", text: "text-emerald-600" },
};

function NotificationPanel({
  token,
  onNavigate,
  onRefresh,
}: {
  token: string;
  onNavigate: (link: string) => void;
  onRefresh?: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useNotificationStore();

  const fetchNotifs = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, setUnreadCount]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      await fetch(`${API_URL}/notifications/${n.id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      fetchNotifs();
      onRefresh?.();
    }
    onNavigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await fetch(`${API_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    fetchNotifs();
    onRefresh?.();
  };

  if (loading)
    return (
      <div className="px-4 py-3 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 bg-slate-100 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-2.5 bg-slate-100 rounded-full w-3/4" />
              <div className="h-2 bg-slate-100 rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );

  if (notifications.length === 0)
    return (
      <div className="py-10 flex flex-col items-center text-center px-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
          <Bell size={18} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">All caught up</p>
        <p className="text-xs text-slate-400">
          No new notifications right now.
        </p>
      </div>
    );

  return (
    <div className="divide-y divide-slate-100">
      <div className="px-4 py-2 flex justify-end">
        <button
          onClick={handleMarkAllRead}
          className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 cursor-pointer"
        >
          Mark all as read
        </button>
      </div>
      {notifications.map((n) => {
        const cfg = notifIconMap[n.type] || notifIconMap.resource;
        const Icon = cfg.icon;
        return (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer ${!n.read ? "bg-teal-50/40" : ""}`}
          >
            <div
              className={`w-8 h-8 ${cfg.bg} ${cfg.text} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}
            >
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700">{n.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                {n.message}
              </p>
            </div>
            {!n.read && (
              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-2" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function LogoutConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "fadeIn 0.15s ease" }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        style={{ animation: "slideUp 0.2s ease" }}
      >
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <LogOut size={20} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900 text-center mb-1">
          Sign out?
        </h3>
        <p className="text-sm text-slate-400 text-center mb-6">
          You'll need to sign back in to access your dashboard.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

/** Chat link with badge for the mobile drawer */
function MobileDrawerChatLink({ onClick }: { onClick: () => void }) {
  const count = useChatStore((s) => s.generalMessageCount);
  return (
    <NavLink
      to="/dashboard/chat"
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between py-2 text-sm ${
          isActive
            ? "text-teal-600 font-semibold"
            : "text-slate-600 hover:text-teal-600"
        }`
      }
    >
      <span>Chat</span>
      {count > 0 && (
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-[1.25rem] px-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold leading-none">
          {count}
        </span>
      )}
    </NavLink>
  );
}

// Bottom tab items for mobile — students
const studentBottomTabs = [
  { name: "Home", path: "/dashboard", icon: LayoutDashboard },
  { name: "Courses", path: "/dashboard/courses", icon: GraduationCap },
  { name: "Groups", path: "/dashboard/groups", icon: Users },
  { name: "Chat", path: "/dashboard/chat", icon: MessageCircle },
  { name: "Profile", path: "/dashboard/profile", icon: User },
];

// Bottom tab items for instructors
const instructorBottomTabs = [
  { name: "Home", path: "/dashboard/instructor", icon: LayoutDashboard },
  {
    name: "Courses",
    path: "/dashboard/instructor/courses",
    icon: GraduationCap,
  },
  { name: "Chat", path: "/dashboard/chat", icon: MessageCircle },
  { name: "Sessions", path: "/dashboard/sessions", icon: Calendar },
  { name: "Profile", path: "/dashboard/profile", icon: User },
];

// Sidebar items for desktop — students
const studentSidebarItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", path: "/dashboard/chat", icon: MessageCircle },
  { name: "Messages", path: "/dashboard/messages", icon: Mail },
  { name: "Courses", path: "/dashboard/courses", icon: GraduationCap },
  { name: "My Groups", path: "/dashboard/groups", icon: Users },
  { name: "Sessions", path: "/dashboard/sessions", icon: Calendar },
  { name: "Resources", path: "/dashboard/resources", icon: FolderOpen },
  { name: "Instructors", path: "/dashboard/instructors", icon: GraduationCap },
  { name: "Progress", path: "/dashboard/progress", icon: TrendingUp },
  { name: "Friends", path: "/dashboard/friends", icon: UserPlus },
  { name: "Library", path: "/dashboard/library", icon: Book },
  { name: "Profile", path: "/dashboard/profile", icon: User },
];

// Sidebar items for desktop — instructors
const instructorSidebarItems = [
  { name: "Dashboard", path: "/dashboard/instructor", icon: LayoutDashboard },
  {
    name: "My Courses",
    path: "/dashboard/instructor/courses",
    icon: GraduationCap,
  },
  {
    name: "Announcements",
    path: "/dashboard/instructor/announcements",
    icon: Megaphone,
  },
  {
    name: "Resources",
    path: "/dashboard/instructor/resources",
    icon: FolderOpen,
  },
  {
    name: "Assignments",
    path: "/dashboard/instructor/assignments",
    icon: ClipboardList,
  },
  {
    name: "Discussions",
    path: "/dashboard/instructor/discussions",
    icon: MessageCircle,
  },
  { name: "Sessions", path: "/dashboard/sessions", icon: Calendar },
  { name: "Groups", path: "/dashboard/groups", icon: Users },
  { name: "General Chat", path: "/dashboard/chat", icon: Users },
  { name: "Profile", path: "/dashboard/profile", icon: User },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, token, user } = useAuth();
  const isInstructor = user?.role === "instructor";
  const sidebarItems = isInstructor
    ? instructorSidebarItems
    : studentSidebarItems;
  const bottomTabs = isInstructor ? instructorBottomTabs : studentBottomTabs;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const { unreadCount, dmUnreadCount, setUnreadCount, incrementUnread, resetDmUnread } = useNotificationStore();
  const notifSocketRef = useRef<Socket | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setUnreadCount(data.count ?? 0);
    } catch {}
  }, [token, setUnreadCount]);

  // Persistent socket for real-time notification push
  useEffect(() => {
    if (!token || !user) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    notifSocketRef.current = socket;

    socket.on("notification", () => {
      incrementUnread();
    });

    return () => {
      socket.disconnect();
      notifSocketRef.current = null;
    };
  }, [token, user?.id, incrementUnread]);

  // Reset DM unread when viewing the messages page
  useEffect(() => {
    if (location.pathname === "/dashboard/messages") {
      resetDmUnread();
    }
  }, [location.pathname, resetDmUnread]);

  // Poll unread count every 30s as fallback
  useEffect(() => {
    if (!token) return;
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token, refreshUnreadCount]);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <ProtectedRoute>
      <PrivateChatProvider>
        {showLogoutModal && (
          <LogoutConfirmModal
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutModal(false)}
          />
        )}
        <div className="flex h-screen bg-slate-50">
          {/* DESKTOP SIDEBAR - visible on md and up */}
          <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r border-slate-200 flex-col shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
              <Link to="/">
                <span className="ml-2 text-xl font-bold text-slate-800">
                  Study<span className="text-teal-600">Circle</span>
                </span>
              </Link>
              {isInstructor && (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-1 rounded-md">
                  Instructor
                </span>
              )}
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <span className="relative">
                    <item.icon size={18} />
                    {item.name === "Messages" && dmUnreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                        {dmUnreadCount > 9 ? "9+" : dmUnreadCount}
                      </span>
                    )}
                  </span>
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200 space-y-1">
              {/* Notifications bell */}
              <div ref={bellRef} className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="relative">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                  Notifications
                </button>

                {showNotifications && (
                  <div
                    className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
                    style={{ animation: "slideUp 0.18s ease" }}
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-[0.12em]">
                        Notifications
                      </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {token && (
                        <NotificationPanel
                          token={token}
                          onNavigate={(link) => {
                            navigate(link);
                            setShowNotifications(false);
                          }}
                          onRefresh={refreshUnreadCount}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex cursor-pointer items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile header (visible only on mobile) */}
            <header className="md:hidden bg-white border-b border-slate-200 h-14 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="font-bold text-slate-800 cursor-pointer"
                >
                  Study<span className="text-teal-600">Circle</span>
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMobileNotifOpen(true)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer relative"
                  aria-label="Notifications"
                >
                  <span className="relative inline-block">
                    <Bell size={20} className="text-slate-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </header>

            {/* Mobile notifications drawer */}
            {mobileNotifOpen && (
              <div
                className="md:hidden fixed inset-0 z-50 flex flex-col bg-white"
                style={{ animation: "slideUp 0.2s ease" }}
              >
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                  <p className="font-bold text-slate-900">Notifications</p>
                  <button
                    onClick={() => setMobileNotifOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} className="text-slate-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {token && (
                    <NotificationPanel
                      token={token}
                      onNavigate={(link) => {
                        navigate(link);
                        setMobileNotifOpen(false);
                      }}
                      onRefresh={refreshUnreadCount}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Mobile drawer (extra links) */}
            {mobileMenuOpen && (
              <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-sm">
                {!isInstructor && (
                  <>
                    <MobileDrawerChatLink
                      onClick={() => setMobileMenuOpen(false)}
                    />
                    <NavLink
                      to="/dashboard/friends"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Friends
                    </NavLink>
                    <NavLink
                      to="/dashboard/sessions"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sessions
                    </NavLink>
                    <NavLink
                      to="/dashboard/progress"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Progress
                    </NavLink>
                    <NavLink
                      to="/dashboard/instructors"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Instructors
                    </NavLink>
                    <NavLink
                      to="/dashboard/library"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Library
                    </NavLink>
                  </>
                )}
                {isInstructor && (
                  <>
                    <NavLink
                      to="/dashboard/instructor/announcements"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Announcements
                    </NavLink>
                    <NavLink
                      to="/dashboard/instructor/resources"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Resources
                    </NavLink>
                    <NavLink
                      to="/dashboard/instructor/assignments"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Assignments
                    </NavLink>
                    <NavLink
                      to="/dashboard/instructor/discussions"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Discussions
                    </NavLink>
                    <NavLink
                      to="/dashboard/groups"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Groups
                    </NavLink>
                    <NavLink
                      to="/dashboard/sessions"
                      className={({ isActive }) =>
                        `block py-2 text-sm ${isActive ? "text-teal-600 font-semibold" : "text-slate-600 hover:text-teal-600"}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sessions
                    </NavLink>
                  </>
                )}
                <div className="border-t border-slate-100 pt-2 mt-1">
                  <button
                    onClick={() => {
                      setShowLogoutModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* Page content - important: pb-20 adds space for fixed bottom bar */}
            <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
              <div className="container mx-auto px-4 py-4 md:py-6">
                <Outlet />
              </div>
            </main>

            {/* FIXED BOTTOM TAB BAR */}
            <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 flex justify-around items-center py-2 px-2 z-10 shadow-lg">
              {bottomTabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  end={
                    tab.path === "/dashboard" ||
                    tab.path === "/dashboard/instructor"
                  }
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-teal-600 scale-105"
                        : "text-slate-500 hover:text-slate-700"
                    }`
                  }
                >
                  <tab.icon size={20} />
                  <span className="text-[10px] font-medium">{tab.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
        <PrivateChatModal />
      </PrivateChatProvider>
    </ProtectedRoute>
  );
}

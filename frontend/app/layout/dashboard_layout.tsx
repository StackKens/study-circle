import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router";
import { ProtectedRoute } from "../components/ProtectedRote";
import { useAuth } from "../context/AuthContext";

import {
  LayoutDashboard, Users, Calendar, User, LogOut, Menu, X,
  FolderOpen, TrendingUp, UserPlus, Book, Bell, Calendar as CalendarIcon,
  FileText, UserPlus as UserPlusIcon, Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Notification {
  id: string;
  type: "session" | "resource" | "friend_request" | "group_recommendation";
  title: string;
  message: string;
  link: string;
  created_at: string;
}

const notifIconMap = {
  session:              { icon: CalendarIcon, bg: "bg-blue-50",   text: "text-blue-500"  },
  resource:             { icon: FileText,     bg: "bg-teal-50",   text: "text-teal-600"  },
  friend_request:       { icon: UserPlusIcon, bg: "bg-amber-50",  text: "text-amber-500" },
  group_recommendation: { icon: Sparkles,     bg: "bg-purple-50", text: "text-purple-500"},
};

function NotificationPanel({ token, onNavigate }: { token: string; onNavigate: (link: string) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
  );

  if (notifications.length === 0) return (
    <div className="py-10 flex flex-col items-center text-center px-4">
      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
        <Bell size={18} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">All caught up</p>
      <p className="text-xs text-slate-400">No new notifications right now.</p>
    </div>
  );

  return (
    <div className="divide-y divide-slate-100">
      {notifications.map((n) => {
        const cfg = notifIconMap[n.type];
        const Icon = cfg.icon;
        return (
          <button
            key={n.id}
            onClick={() => onNavigate(n.link)}
            className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className={`w-8 h-8 ${cfg.bg} ${cfg.text} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Icon size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700">{n.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{n.message}</p>
            </div>
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

// Bottom tab items for mobile
const bottomTabs = [
  { name: "Home", path: "/dashboard", icon: LayoutDashboard },
  { name: "Groups", path: "/dashboard/groups", icon: Users },
  { name: "Sessions", path: "/dashboard/sessions", icon: Calendar },
  { name: "Library", path: "/dashboard/library", icon: Book },
  { name: "Profile", path: "/dashboard/profile", icon: User },
];

// Sidebar items for desktop
const sidebarItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "My Groups", path: "/dashboard/groups", icon: Users },
  { name: "Sessions", path: "/dashboard/sessions", icon: Calendar },
  { name: "Resources", path: "/dashboard/resources", icon: FolderOpen },
  { name: "Progress", path: "/dashboard/progress", icon: TrendingUp },
  { name: "Friends", path: "/dashboard/friends", icon: UserPlus },
  { name: "Library", path: "/dashboard/library", icon: Book },
  { name: "Profile", path: "/dashboard/profile", icon: User },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

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
                <item.icon size={18} />
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
                <Bell size={18} />
                Notifications
              </button>

              {showNotifications && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
                  style={{ animation: "slideUp 0.18s ease" }}
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-[0.12em]">Notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {token && (
                      <NotificationPanel
                        token={token}
                        onNavigate={(link) => { navigate(link); setShowNotifications(false); }}
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
              <Link to="/" className="font-bold text-slate-800 cursor-pointer">
                Study<span className="text-teal-600">Circle</span>
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMobileNotifOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer relative"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-slate-600" />
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
                    onNavigate={(link) => { navigate(link); setMobileNotifOpen(false); }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Mobile drawer (extra links) */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 shadow-sm">
              <NavLink
                to="/dashboard/resources"
                className="block py-2 text-sm text-slate-600 hover:text-teal-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </NavLink>
              <NavLink
                to="/dashboard/progress"
                className="block py-2 text-sm text-slate-600 hover:text-teal-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Progress
              </NavLink>
              <NavLink
                to="/dashboard/friends"
                className="block py-2 text-sm text-slate-600 hover:text-teal-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Friends
              </NavLink>
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
                end={tab.path === "/dashboard"}
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
    </ProtectedRoute>
  );
}

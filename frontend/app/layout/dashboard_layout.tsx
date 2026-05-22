import { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router";
import { ProtectedRoute } from "../components/ProtectedRote";

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
} from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/");
  };

  return (
    <ProtectedRoute>
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
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
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
                className="font-bold text-slate-800   cursor-pointer"
              >
                Study<span className="text-teal-600">Circle</span>
              </Link>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </header>

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
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm text-red-600 hover:text-red-700 "
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

import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderOpen,
  TrendingUp,
  UserPlus,
  LogOut,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "My Groups", path: "/dashboard/groups", icon: Users },
  { name: "Sessions", path: "/dashboard/sessions", icon: Calendar },
  { name: "Resources", path: "/dashboard/resources", icon: FolderOpen },
  { name: "Progress", path: "/dashboard/progress", icon: TrendingUp },
  { name: "Friends", path: "/dashboard/friends", icon: UserPlus },
];

export function DashboardSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r border-slate-200 flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
        <span className="ml-2 text-xl font-bold text-slate-800">
          Study<span className="text-teal-600">Circle</span>
        </span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

import { Search, Bell, User } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search groups, resources..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-teal-700" />
          </div>
          <span className="text-sm font-medium text-slate-700">Drex</span>
        </div>
      </div>
    </header>
  );
}

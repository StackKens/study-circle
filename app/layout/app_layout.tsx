import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Menu, X, BookOpen } from "lucide-react";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "The Study Way", to: "/#how" },
    { label: "Features", to: "/#features" },
    { label: "Universities", to: "/#universities" },
    { label: "Stories", to: "/#testimonials" },
  ];

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-teal-500 transition-colors duration-200">
              <BookOpen size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              Study<span className="text-teal-600">Cycle</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.to}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-150"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/auth/login"
              className="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-150"
            >
              Log in
            </Link>
            <Link
              to="/auth/register"
              className="px-5 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm transition-all duration-150 hover:-translate-y-px"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.to}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-150"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-slate-100 mt-2 pt-3 flex flex-col gap-2">
              <Link
                to="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-all text-center"
              >
                Log in
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-center transition-all"
              >
                Get started free
              </Link>
            </div>
          </div>
        )}
      </nav>

      <Outlet />
    </>
  );
}

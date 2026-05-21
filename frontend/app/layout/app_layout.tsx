import { useState } from "react";
import { Link, Outlet } from "react-router";
import { Menu, X, BookOpen } from "lucide-react";
import { AuthModal } from "../components/ui/AuthModal";
import { useAuthModal } from "../context/AuthModalContext";

// useAuth is imported only if you need user data in the layout (optional)
// import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { authModalType, closeAuthModal, openAuthModal } = useAuthModal();
  // const { user } = useAuth(); // if you need user info

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
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-teal-500 transition-colors">
              <BookOpen size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              Study<span className="text-teal-600">Circle</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.to}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => openAuthModal("login")}
              className="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              Log in
            </button>
            <button
              onClick={() => openAuthModal("register")}
              className="px-5 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm transition-all hover:-translate-y-px cursor-pointer"
            >
              Get started free
            </button>
          </div>

          {/* Mobile toggle */}
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
                className="px-4 py-3 text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-slate-100 mt-2 pt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openAuthModal("login");
                }}
                className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg text-center cursor-pointer"
              >
                Log in
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openAuthModal("register");
                }}
                className="px-4 py-3 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-center transition-all cursor-pointer"
              >
                Get started free
              </button>
            </div>
          </div>
        )}
      </nav>

      <Outlet />

      <AuthModal
        isOpen={authModalType !== null}
        onClose={closeAuthModal}
        type={authModalType || "login"}
        onSwitch={() =>
          openAuthModal(authModalType === "login" ? "register" : "login")
        }
      />
    </>
  );
}

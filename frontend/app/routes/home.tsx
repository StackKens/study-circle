import { useEffect, useState } from "react";
import {
  Calendar,
  BarChart2,
  Users,
  Bell,
  Lock,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MessageCircle,
  FolderOpen,
} from "lucide-react";
import { useAuthModal } from "../context/AuthModalContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export function meta() {
  return [
    { title: "StudyCircle • Study Together" },
    { name: "description", content: "The modern study platform for students" },
  ];
}

//  Types
interface TopUser {
  id: string;
  name: string;
  university: string;
  course: string;
  year_of_study: number;
  avatar_url?: string;
}

interface Testimonial {
  id: string;
  name: string;
  university: string;
  course: string;
  year_of_study: number;
  quote: string;
  rating: number;
  avatar_url?: string;
}

interface HomeStats {
  student_count: number;
  group_count: number;
  session_count: number;
  resource_count: number;
  studying_now: number;
  top_users: TopUser[];
  testimonials: Testimonial[];
  universities: string[];
}

//  Static content
const features = [
  {
    icon: BookOpen,
    title: "Resource Board",
    desc: "Clean organized space to share notes, PDFs, links and files. Searchable and always available.",
  },
  {
    icon: Calendar,
    title: "Session Scheduler",
    desc: "Propose study times and get confirmations from members. Never study alone again.",
  },
  {
    icon: BarChart2,
    title: "Progress Tracker",
    desc: "Mark topics complete and see your group's collective progress at a glance.",
  },
  {
    icon: Users,
    title: "Group Matching",
    desc: "Find peers studying the exact same course at your university. Smart recommendations.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Get notified when someone posts a resource or schedules a session. Stay in the loop.",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    desc: "Groups are private. Only invited or approved students can join your circle.",
  },
];

const steps = [
  {
    num: "01",
    title: "Create or Join a Group",
    desc: "Search by course code or subject and connect with students taking the same classes.",
  },
  {
    num: "02",
    title: "Share & Collaborate",
    desc: "Upload notes, past papers, links and resources. Everything stays organized in one place.",
  },
  {
    num: "03",
    title: "Stay Accountable",
    desc: "Schedule study sessions, track progress together, and motivate each other.",
  },
];

const footerCols = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "For Students", href: "/#how" },
      { label: "For Universities", href: "/#testimonials" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Community Guidelines", href: "/guidelines" },
    ],
  },
];

//  Component
export default function Home() {
  const { openAuthModal } = useAuthModal();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    function fetchStats() {
      fetch(`${API_URL}/users/home-stats?t=${Date.now()}`)
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch(console.error);
    }
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const studentCount = stats?.student_count ?? null;
  const topUsers = stats?.top_users ?? [];
  const universities = stats?.universities ?? [];
  const testimonials = stats?.testimonials ?? [];
  const activeTestimonial = testimonials[testimonialIndex] ?? null;

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setTestimonialIndex((index) => (index + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <main className="bg-white font-sans">
      {/*  HERO  */}
      <section className="min-h-screen flex flex-col justify-center bg-[#0a0f1e] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/[0.07] blur-[120px]" />
        </div>
        <div className="absolute top-0 inset-x-0 h-px bg-white/[0.06]" />

        <div className="max-w-6xl mx-auto px-8 py-32 relative z-10 w-full">
          {/* Headline */}
          <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[1.06] tracking-[-0.03em] text-white max-w-3xl mb-7">
            Study with focus.{" "}
            <span className="text-teal-400">Succeed together.</span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-xl mb-12">
            Connect with students taking the same courses. Share quality
            materials, schedule sessions, and stay accountable — all in one
            quiet, focused space.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-5 mb-16">
            <button
              onClick={() => openAuthModal("register")}
              className="inline-flex items-center gap-2.5 bg-teal-500 hover:bg-teal-400 text-white px-7 py-3.5 rounded-lg font-semibold text-sm tracking-wide shadow-lg shadow-teal-500/20 transition-all duration-200 hover:-translate-y-px cursor-pointer"
            >
              Join Free <ArrowRight size={15} />
            </button>
            <button
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center gap-2 text-slate-400 cursor-pointer hover:text-white text-sm font-medium transition-colors duration-200 group"
            >
              Sign in
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform duration-200"
              />
            </button>
          </div>

          {/* Social proof — real avatars */}
          <div className="flex items-center gap-4 border-t border-white/[0.07] pt-8">
            <div className="flex -space-x-2">
              {topUsers.length > 0
                ? topUsers.map((u) =>
                    u.avatar_url ? (
                      <img
                        key={u.id}
                        src={u.avatar_url}
                        alt={u.name}
                        className="w-7 h-7 rounded-full border-[2px] border-[#0a0f1e] object-cover"
                      />
                    ) : (
                      <div
                        key={u.id}
                        className="w-7 h-7 rounded-full border-[2px] border-[#0a0f1e] bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold"
                      >
                        {u.name.charAt(0)}
                      </div>
                    ),
                  )
                : [
                    "bg-rose-400",
                    "bg-blue-400",
                    "bg-amber-400",
                    "bg-teal-400",
                  ].map((c, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full border-[2px] border-[#0a0f1e] ${c}`}
                    />
                  ))}
            </div>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                <span className="relative rounded-full w-2 h-2 bg-emerald-400" />
              </span>
              <span>
                <span className="text-slate-200 font-semibold">
                  {stats?.studying_now ?? "..."}
                </span>
                {" studying now · "}
                <span className="text-slate-200 font-semibold">
                  {studentCount !== null
                    ? `${studentCount.toLocaleString()}+`
                    : "..."}
                </span>{" "}
                students
              </span>
            </p>
          </div>
        </div>

        {/* Layered fade transition to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0f1e]/70 via-[#0a0f1e]/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/[0.06] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/[0.12] to-transparent pointer-events-none" />
      </section>

      {/*  UNIVERSITIES ─ */}
      <section className="py-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-8 mb-5">
          <p className="text-center text-slate-400 text-[11px] tracking-[0.18em] uppercase font-medium">
            Trusted at
          </p>
        </div>
        {universities.length > 0 && (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div
              className="flex gap-14 items-center"
              style={{
                animation: "scroll-unis 40s linear infinite",
                width: "max-content",
              }}
            >
              {[...universities, ...universities].map((uni, i) => (
                <p
                  key={i}
                  className="text-slate-400 text-sm font-medium whitespace-nowrap"
                >
                  {uni}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>

      {/*  STATS STRIP ─ */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              {
                label: "Students",
                value: stats?.student_count ?? null,
                suffix: "+",
              },
              {
                label: "Study Groups",
                value: stats?.group_count ?? null,
                suffix: "",
              },
              {
                label: "Sessions",
                value: stats?.session_count ?? null,
                suffix: "+",
              },
              {
                label: "Resources",
                value: stats?.resource_count ?? null,
                suffix: "+",
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight tabular-nums">
                  {stat.value !== null
                    ? `${stat.value.toLocaleString()}${stat.suffix}`
                    : "—"}
                </p>
                <p className="text-sm text-slate-400 mt-1.5 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  HOW IT WORKS ─ */}
      <section id="how" className="py-28 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">
              How it works
            </p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Three steps to studying smarter
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <div key={step.num}>
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-[11px] font-bold text-slate-300 tracking-[0.12em]">
                    {step.num}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block flex-1 h-px bg-slate-100" />
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  PRODUCT PREVIEW ─ */}
      <section className="py-20 px-8 bg-slate-50/60 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">
              Platform
            </p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
              See it in action
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              A clean dashboard designed for focused collaboration.
            </p>
          </div>

          {/* Browser mockup — matches actual app design */}
          <div className="relative mx-auto max-w-4xl">
            {/* Browser chrome */}
            <div className="bg-slate-100 rounded-t-xl px-4 py-3 flex items-center gap-2 border border-slate-200 border-b-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-3 flex-1 max-w-[180px] bg-white rounded-md px-3 py-1.5 text-[11px] text-slate-400 font-medium truncate">
                dashboard
              </div>
            </div>

            <div className="bg-white rounded-b-xl border border-slate-200 overflow-hidden">
              <div className="flex h-[400px] md:h-[420px]">
                {/* Sidebar */}
                <div className="w-44 md:w-52 bg-white border-r border-slate-200 p-3 shrink-0 hidden sm:flex flex-col gap-1">
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: MessageCircle, label: "Chat" },
                    { icon: Users, label: "Groups" },
                    { icon: Calendar, label: "Sessions" },
                    { icon: FolderOpen, label: "Resources" },
                  ].map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? "bg-teal-50 text-teal-700 border-l-4 border-emerald-500"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Main content — matches actual dashboard cards */}
                <div className="flex-1 p-4 md:p-5 space-y-3 min-w-0 bg-[var(--bg)]">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Groups",
                        value: "4",
                        style: "bg-teal-50 text-teal-600",
                      },
                      {
                        label: "Sessions",
                        value: "12",
                        style: "bg-blue-50 text-blue-600",
                      },
                      {
                        label: "Resources",
                        value: "28",
                        style: "bg-amber-50 text-amber-600",
                      },
                    ].map(({ label, value, style }) => (
                      <div
                        key={label}
                        className="bg-white rounded-xl p-3 border border-slate-200"
                      >
                        <div
                          className={`w-6 h-6 ${style} rounded-lg flex items-center justify-center mb-2`}
                        >
                          <span className="text-[10px] font-bold">{value}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 h-[220px] md:h-[230px]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                      <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-[8px] font-bold">
                        G
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        General Chat
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                          S
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-700">
                            Stackkens
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Anyone up for a study session tomorrow?
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                          J
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-700">
                            James
                          </p>
                          <p className="text-[11px] text-slate-400">
                            I'm in! 2pm works for me.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 opacity-60">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                          P
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-700">
                            Peter
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Let's use the library group room.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  FEATURES  */}
      <section
        id="features"
        className="py-28 px-8 bg-slate-50/60 border-y border-slate-100"
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">
              Features
            </p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
              Everything you need
            </h2>
            <p className="text-slate-500 text-sm max-w-sm">
              Built for serious students. No bloat — just the tools that help.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white p-7 hover:bg-teal-50/40 transition-colors duration-300 cursor-default group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-teal-600 transition-colors duration-200">
                  <Icon
                    size={18}
                    className="text-slate-600 group-hover:text-white transition-colors duration-200"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 tracking-tight">
                  {title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  TESTIMONIALS — real users  */}
      <section id="testimonials" className="py-28 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">
              Student stories
            </p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Real students. Real results.
            </h2>
          </div>

          {activeTestimonial && (
            <div className="relative">
              <div className="relative bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="lg:grid lg:grid-cols-5">
                  {/* --- Quote panel --- */}
                  <div className="relative col-span-3 p-8 md:p-10 lg:pr-0">
                    <div className="absolute top-4 left-6 text-[5rem] md:text-[7rem] font-serif text-teal-500/8 leading-none select-none pointer-events-none">
                      &ldquo;
                    </div>

                    <div className="relative z-10">
                      <div className="flex gap-1 mb-5">
                        {[...Array(activeTestimonial.rating)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-4 h-4 text-amber-400 fill-amber-400"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>

                      <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                        &ldquo;{activeTestimonial.quote}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* --- Author panel (visible on lg+) --- */}
                  <div className="hidden lg:flex col-span-2 bg-slate-50/80 flex-col items-center justify-center p-10 text-center border-l border-slate-100">
                    {activeTestimonial.avatar_url ? (
                      <img
                        src={activeTestimonial.avatar_url}
                        alt={activeTestimonial.name}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-sm mb-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ring-4 ring-white shadow-sm mb-4">
                        {activeTestimonial.name.charAt(0)}
                      </div>
                    )}
                    <p className="font-semibold text-slate-900">
                      {activeTestimonial.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-40">
                      {activeTestimonial.university}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-2">
                      Year {activeTestimonial.year_of_study} ·{" "}
                      {activeTestimonial.course}
                    </p>
                  </div>

                  {/* --- Author bar (mobile) --- */}
                  <div className="flex lg:hidden items-center gap-3 px-8 pb-8 md:px-10 md:pb-10">
                    {activeTestimonial.avatar_url ? (
                      <img
                        src={activeTestimonial.avatar_url}
                        alt={activeTestimonial.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ring-2 ring-slate-100">
                        {activeTestimonial.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {activeTestimonial.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {activeTestimonial.university}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {testimonials.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setTestimonialIndex(
                        (testimonialIndex - 1 + testimonials.length) %
                          testimonials.length,
                      )
                    }
                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {testimonials.map((testimonial, index) => (
                    <button
                      key={testimonial.id}
                      type="button"
                      onClick={() => setTestimonialIndex(index)}
                      className={`rounded-full transition-all cursor-pointer ${
                        index === testimonialIndex
                          ? "w-6 h-2 bg-teal-600"
                          : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Show testimonial ${index + 1}`}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setTestimonialIndex(
                        (testimonialIndex + 1) % testimonials.length,
                      )
                    }
                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/*  INSTRUCTOR SECTION ─ */}
      <section className="py-20 px-8 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">
            For Instructors
          </p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
            Are you an instructor?
          </h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-10 leading-relaxed">
            Manage courses, post announcements, share resources, create
            assignments with grading, and lead discussions — all within
            StudyCircle.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
            {[
              {
                title: "Course Management",
                desc: "Create and organize courses with structured content.",
              },
              {
                title: "Assignments & Grading",
                desc: "Post assignments, collect submissions, and grade with feedback.",
              },
              {
                title: "Announcements",
                desc: "Broadcast updates to all enrolled students instantly.",
              },
              {
                title: "Discussions",
                desc: "Facilitate course-wide discussions and Q&A.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="bg-slate-50 rounded-xl p-5 border border-slate-100"
              >
                <h3 className="font-semibold text-slate-900 text-sm mb-1.5">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  FINAL CTA  */}
      <section className="py-28 px-8 bg-[#0a0f1e] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-teal-500/[0.06] blur-[100px] rounded-full" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-white tracking-tight mb-5 leading-tight">
            Start studying smarter today
          </h2>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            Join thousands of students already improving their grades together.
          </p>
          <button
            onClick={() => openAuthModal("register")}
            className="inline-flex items-center gap-2.5 bg-teal-500 hover:bg-teal-400 text-white px-8 py-4 rounded-lg font-semibold text-base shadow-xl shadow-teal-500/20 transition-all duration-200 hover:-translate-y-px cursor-pointer"
          >
            Get Started Free <ArrowRight size={16} />
          </button>
          <p className="text-slate-700 text-xs mt-5">
            No credit card required · Takes less than 30 seconds
          </p>
        </div>
      </section>

      {/*  FOOTER  */}
      <footer className="bg-[#070b16] text-slate-500">
        <div className="max-w-5xl mx-auto px-8 pt-16 pb-10">
          <div className="grid md:grid-cols-5 gap-10 mb-14">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <img src="/favicon.svg" alt="StudyCircle" className="w-7 h-7" />
                <span className="text-white font-bold">
                  Study<span className="text-teal-400">Circle</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs text-slate-500">
                The modern study platform built for university students in
                Uganda and beyond.
              </p>
            </div>
            {footerCols.map((col) => (
              <div key={col.heading}>
                <h4 className="font-semibold text-slate-300 mb-4 text-xs uppercase tracking-[0.12em]">
                  {col.heading}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm hover:text-slate-200 transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.05] pt-8 text-xs flex flex-col md:flex-row justify-between items-center gap-3 text-slate-700">
            <p>© 2026 StudyCircle Victoria University. All rights reserved.</p>
            <p>Made with love for students, by students.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

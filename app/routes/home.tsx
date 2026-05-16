import { Link } from "react-router";
import {
  BookOpen,
  Calendar,
  BarChart2,
  Users,
  Bell,
  Lock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export function meta() {
  return [
    { title: "StudyCycle • Study Together" },
    { name: "description", content: "The modern study platform for students" },
  ];
}

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

const testimonials = [
  {
    quote:
      "StudyCycle turned my chaotic WhatsApp groups into an organized, productive space. My CGPA improved this semester.",
    name: "Alex Stackkens",
    role: "Makerere University • Year 3 CS",
    initials: "AS",
    color: "bg-rose-100 text-rose-700",
  },
  {
    quote:
      "The best study tool I've used in university. The progress tracker keeps everyone motivated and on track.",
    name: "Mushabenta Linic",
    role: "Victoria University • Year 2",
    initials: "ML",
    color: "bg-blue-100 text-blue-700",
  },
  {
    quote:
      "Finding serious students studying the same course has never been easier. This is what we needed.",
    name: "Odoi Simon Chidz",
    role: "Makerere University • Year 1",
    initials: "OS",
    color: "bg-amber-100 text-amber-700",
  },
];

const universities = [
  "Victoria University",
  "Makerere University",
  "Kyambogo University",
  "Uganda Christian University",
  "Ndejje University",
  "MUBS",
];

const footerCols = [
  {
    heading: "Product",
    links: ["Features", "For Students", "For Universities"],
  },
  { heading: "Company", links: ["About Us", "Blog", "Careers", "Contact"] },
  {
    heading: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Community Guidelines"],
  },
];

export default function Home() {
  return (
    <main className="bg-slate-50">
      {/* HERO */}

      <section className="min-h-screen flex items-center text-white relative overflow-hidden bg-slate-900">
        {/* Clean gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-teal-950 to-slate-900" />

        <div className="absolute top-0 left-1/4 w-150 h-150 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-100 h-100 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-8 py-32 grid md:grid-cols-2 gap-16 items-center relative z-10 w-full">
          {/* Left */}
          <div className="space-y-8">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/8 backdrop-blur-md px-5 py-2.5 rounded-xl text-sm border border-white/12 text-slate-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              Live in 12+ Ugandan Universities
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Study with focus.
              <br />
              <span className="text-teal-400">Succeed together.</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
              The platform where students taking the same courses connect, share
              quality materials, schedule sessions, and stay accountable.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-teal-500/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                Join Free
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 border border-white/20 hover:bg-white/8 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-medium text-base transition-all duration-200"
              >
                Sign in
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2.5">
                {[
                  "bg-rose-400",
                  "bg-blue-400",
                  "bg-amber-400",
                  "bg-teal-400",
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-slate-900 ${c}`}
                  />
                ))}
              </div>
              <p className="text-slate-400 text-sm">
                <span className="text-white font-semibold">12,000+</span>{" "}
                students studying right now
              </p>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-3">
            {/* Group card */}
            <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-base">
                    Data Structures & Algorithms
                  </p>
                  <p className="text-slate-400 text-sm mt-0.5">12 members</p>
                </div>
                <span className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live session
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-teal-400 rounded-full" />
                </div>
                <span className="text-teal-400 text-xs font-semibold">75%</span>
              </div>
            </div>

            {/* Session card */}
            <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                    Next session
                  </p>
                  <p className="font-semibold text-sm mt-0.5">
                    Database Systems Review
                  </p>
                  <p className="text-teal-400 text-xs mt-0.5">
                    Today at 4:00 PM • 9 members going
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: "4", label: "Active groups", color: "text-teal-400" },
                { val: "52", label: "Resources", color: "text-amber-400" },
                { val: "7", label: "Online now", color: "text-emerald-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center"
                >
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-slate-500 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  "Resource sharing",
                  "Session scheduling",
                  "Progress tracking",
                  "Group matching",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-slate-300 text-sm"
                  >
                    <CheckCircle size={14} className="text-teal-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* UNIVERSITIES */}
      <section
        id="universities"
        className="bg-white py-12 border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-center text-slate-400 text-xs tracking-widest uppercase mb-8 font-medium">
            Proudly used at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
            {universities.map((uni) => (
              <p
                key={uni}
                className="font-semibold text-base text-slate-400 hover:text-teal-700 transition-colors cursor-default"
              >
                {uni}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* THE STUDY WAY */}
      <section id="how" className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
            The Study Way
          </p>
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Simple. Powerful. Effective.
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Three steps to better academic performance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative text-center group">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] right-[-40%] h-px bg-slate-200 z-0" />
              )}
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto bg-teal-50 border-2 border-teal-100 text-teal-700 rounded-2xl flex items-center justify-center text-lg font-bold mb-6 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-all duration-200">
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-3 text-slate-800">
                  {step.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="bg-slate-50 border-y border-slate-100 py-24"
      >
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Everything you need
            </h2>
            <p className="text-slate-500">
              Built for serious students. No bloat. Just the tools that help.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white p-7 rounded-2xl border border-slate-200 hover:-translate-y-1.5 hover:shadow-lg hover:border-teal-100 transition-all duration-300 cursor-default group"
              >
                <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-teal-600 transition-colors duration-200">
                  <Icon
                    size={20}
                    className="text-teal-600 group-hover:text-white transition-colors duration-200"
                  />
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-800">
                  {title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
            Stories
          </p>
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Real students. Real results.
          </h2>
          <p className="text-slate-500">
            Thousands of students already studying smarter
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white p-7 rounded-2xl border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-amber-400 fill-amber-400"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed text-sm flex-1">
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${t.color} rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-teal-950/60 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-75 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto text-center px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-5">
            Start studying smarter today
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Join thousands of students already improving their grades together.
          </p>
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-teal-500/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Link>
          <p className="text-slate-600 text-sm mt-5">
            No credit card required • Takes less than 30 seconds
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-500">
        <div className="max-w-7xl mx-auto px-8 pt-16 pb-10">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <BookOpen
                    size={16}
                    className="text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-white font-bold text-lg">
                  Study<span className="text-teal-400">Cycle</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                The modern study platform built for university students in
                Uganda and beyond.
              </p>
              <p className="text-xs mt-4 text-slate-700 tracking-widest uppercase">
                Learn • Connect • Grow
              </p>
            </div>

            {footerCols.map((col) => (
              <div key={col.heading}>
                <h4 className="font-semibold text-slate-300 mb-4 text-sm">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm hover:text-slate-200 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-900 pt-8 text-xs flex flex-col md:flex-row justify-between items-center gap-3 text-slate-700">
            <p>© 2026 StudyCycle Uganda. All rights reserved.</p>
            <p>Made with care for students, by students.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

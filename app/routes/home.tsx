import {
  BookOpen,
  Calendar,
  BarChart2,
  Users,
  Bell,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useAuthModal } from "~/context/AuthContext";

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
  },
  {
    quote:
      "The best study tool I've used in university. The progress tracker keeps everyone motivated and on track.",
    name: "Mushabenta Linic",
    role: "Victoria University • Year 2",
    initials: "ML",
  },
  {
    quote:
      "Finding serious students studying the same course has never been easier. This is what we needed.",
    name: "Odoi Simon Chidz",
    role: "Makerere University • Year 1",
    initials: "OS",
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
  const { openAuthModal } = useAuthModal();

  return (
    <main className="bg-white font-sans">
      {/*  HERO  */}
      <section className="min-h-screen flex flex-col justify-center bg-[#0a0f1e] text-white relative overflow-hidden">
        {/* Single, subtle ambient glow — no noise */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/[0.07] blur-[120px]" />
        </div>

        {/* Thin top rule */}
        <div className="absolute top-0 inset-x-0 h-px bg-white/[0.06]" />

        <div className="max-w-6xl mx-auto px-8 py-32 relative z-10 w-full">
          {/* Status pill — minimal */}
          <div className="mb-12 flex items-center gap-2.5 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs text-slate-400 tracking-[0.12em] uppercase font-medium">
              Live in 12+ Ugandan Universities
            </span>
          </div>

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
              Join Free
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center gap-2 text-slate-400  cursor-pointer hover:text-white text-sm font-medium transition-colors duration-200 group"
            >
              Sign in
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 cursor-pointer transition-transform duration-200"
              />
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 border-t border-white/[0.07] pt-8">
            <div className="flex -space-x-2">
              {[
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
            <p className="text-slate-500 text-sm">
              <span className="text-slate-200 font-semibold">12,000+</span>{" "}
              students studying right now
            </p>
          </div>
        </div>

        {/* App preview — right side, desktop only */}
        <div className="hidden lg:flex flex-col gap-3 absolute right-10 top-1/2 -translate-y-1/2 w-[320px]">
          {/* Group card */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-sm text-white">
                  Data Structures & Algorithms
                </p>
                <p className="text-slate-500 text-xs mt-0.5">12 members</p>
              </div>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-teal-400 rounded-full" />
              </div>
              <span className="text-teal-400 text-xs font-semibold">75%</span>
            </div>
          </div>

          {/* Session card */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 backdrop-blur-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-teal-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">
                Next session
              </p>
              <p className="text-white font-semibold text-sm">
                Database Systems Review
              </p>
              <p className="text-teal-400 text-xs mt-0.5">
                Today at 4:00 PM · 9 attending
              </p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { val: "4", label: "Groups", color: "text-teal-400" },
              { val: "52", label: "Resources", color: "text-amber-400" },
              { val: "7", label: "Online", color: "text-emerald-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 text-center backdrop-blur-sm"
              >
                <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-slate-600 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  UNIVERSITIES  */}
      <section className="border-y border-slate-100 py-10">
        <div className="max-w-5xl mx-auto px-8">
          <p className="text-center text-slate-400 text-[11px] tracking-[0.18em] uppercase mb-7 font-medium">
            Trusted at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-3">
            {universities.map((uni) => (
              <p
                key={uni}
                className="text-slate-400 text-sm font-medium hover:text-teal-700 transition-colors duration-200 cursor-default"
              >
                {uni}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/*  HOW IT WORKS  */}
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

          {/* Grid with dividers instead of individual cards */}
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

      {/*  TESTIMONIALS  */}
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

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between p-7 rounded-2xl border border-slate-200 bg-white hover:border-teal-200 hover:shadow-sm transition-all duration-300"
              >
                <div>
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    "{t.quote}"
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-3 pt-6 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {t.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  FINAL CTA  */}
      <section className="py-28 px-8 bg-[#0a0f1e] relative overflow-hidden">
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
            className="inline-flex items-center gap-2.5 bg-teal-500 hover:bg-teal-400 text-white px-8 py-4 rounded-lg font-semibold text-base shadow-xl shadow-teal-500/20 transition-all duration-200 hover:-translate-y-px"
          >
            Get Started Free
            <ArrowRight size={16} />
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
                <div className="w-7 h-7 bg-teal-600 rounded-md flex items-center justify-center">
                  <BookOpen
                    size={14}
                    className="text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-white font-bold">
                  Study<span className="text-teal-400">Cycle</span>
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
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm hover:text-slate-200 transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.05] pt-8 text-xs flex flex-col md:flex-row justify-between items-center gap-3 text-slate-700">
            <p>© 2026 StudyCycle Uganda. All rights reserved.</p>
            <p>Made with love for students, by students.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

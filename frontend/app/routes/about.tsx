import { BookOpen, Users, Target, Heart } from "lucide-react";

export function meta() {
  return [{ title: "About · StudyCircle" }];
}

export default function About() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Company</p>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">About StudyCircle</h1>
      <p className="text-slate-500 text-base leading-relaxed max-w-2xl mb-16">
        StudyCircle is a collaborative learning platform built specifically for university students in Uganda and beyond. We believe education becomes more effective when students learn together.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-16">
        {[
          {
            icon: Target,
            title: "Our Mission",
            desc: "To make collaborative learning accessible to every university student — regardless of their institution, course, or background.",
          },
          {
            icon: Heart,
            title: "Why We Built This",
            desc: "Too many students study alone, struggle to find peers, and lack organized tools for group learning. StudyCircle solves that.",
          },
          {
            icon: Users,
            title: "Who It's For",
            desc: "University students, study groups, academic clubs, peer mentors, and tutors who want a focused space to collaborate.",
          },
          {
            icon: BookOpen,
            title: "What We're Building",
            desc: "A platform that combines resource sharing, session scheduling, progress tracking, and AI-powered recommendations in one place.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-6 bg-white rounded-xl border border-slate-200 hover:border-teal-200 transition-colors">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
              <Icon size={18} className="text-teal-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Built by students, for students</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          StudyCircle was developed by Stackkens — a developer who experienced firsthand the challenges of collaborative learning at university. The platform is actively maintained and improved based on real student feedback.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mt-4">
          Have feedback or want to get in touch? Reach us at{" "}
          <a href="mailto:hello@studycircle.app" className="text-teal-600 hover:underline">hello@studycircle.app</a>.
        </p>
      </div>
    </main>
  );
}

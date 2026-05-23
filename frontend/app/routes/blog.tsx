import { useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";

export function meta() {
  return [{ title: "Blog · StudyCircle" }];
}

const comingSoonPosts = [
  {
    tag: "Study Tips",
    title: "5 ways study groups improve your grades",
    desc: "Research shows students who study in groups retain information 40% better. Here's how to make the most of collaborative learning.",
  },
  {
    tag: "Platform",
    title: "How we built StudyCircle for Ugandan students",
    desc: "A behind-the-scenes look at the decisions, challenges, and lessons learned building a student platform from scratch.",
  },
  {
    tag: "Productivity",
    title: "The Pomodoro technique for group study sessions",
    desc: "How to structure your group study time for maximum focus and minimum burnout — with practical session templates.",
  },
];

export default function Blog() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Blog</p>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">StudyCircle Blog</h1>
      <p className="text-slate-500 text-sm leading-relaxed max-w-xl mb-16">
        Study tips, platform updates, and insights on collaborative learning. Coming soon.
      </p>

      {/* Coming soon posts preview */}
      <div className="space-y-4 mb-16">
        {comingSoonPosts.map((post) => (
          <div key={post.title} className="p-6 bg-white rounded-xl border border-slate-200 hover:border-teal-200 transition-colors opacity-60">
            <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-[0.12em] mb-3 block">{post.tag}</span>
            <h3 className="font-semibold text-slate-900 mb-2">{post.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{post.desc}</p>
            <p className="text-xs text-slate-300 mt-4 font-medium">Coming soon</p>
          </div>
        ))}
      </div>

      {/* Email signup */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <BookOpen size={20} className="text-teal-600" />
        </div>
        <h2 className="font-bold text-slate-900 mb-2">Get notified when we publish</h2>
        <p className="text-sm text-slate-500 mb-6">No spam. Just useful content for students, when it's ready.</p>

        {subscribed ? (
          <p className="text-sm text-teal-600 font-medium">You're on the list — we'll be in touch!</p>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}
            className="flex gap-2 max-w-sm mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-500 transition-all"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Notify me <ArrowRight size={13} />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export function meta() {
  return [{ title: "Community Guidelines · StudyCircle" }];
}

const guidelines = [
  {
    title: "Be respectful",
    desc: "Treat every student with respect regardless of their university, course, or academic level. Harassment, discrimination, or bullying of any kind is not tolerated.",
  },
  {
    title: "Share quality content",
    desc: "Only share resources that are relevant, accurate, and helpful to your group. Do not upload copyrighted material without permission.",
  },
  {
    title: "Stay on topic",
    desc: "Keep discussions and resources relevant to the study group's subject. Off-topic content clutters the space for everyone.",
  },
  {
    title: "No spam",
    desc: "Do not send unsolicited friend requests, promotional content, or repetitive messages to other students.",
  },
  {
    title: "Protect privacy",
    desc: "Do not share other students' personal information without their consent. What happens in a study group stays in the group.",
  },
  {
    title: "Academic integrity",
    desc: "StudyCircle is for collaborative learning — not cheating. Do not use the platform to share exam answers or facilitate academic dishonesty.",
  },
];

export default function CommunityGuidelines() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Community</p>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Community Guidelines</h1>
      <p className="text-slate-500 text-sm mb-12 max-w-xl">
        StudyCircle is built on trust and collaboration. These guidelines keep the platform a safe, productive space for every student.
      </p>

      <div className="space-y-6">
        {guidelines.map((g, i) => (
          <div key={g.title} className="flex gap-5 p-6 bg-white rounded-xl border border-slate-200 hover:border-teal-200 transition-colors">
            <span className="text-[11px] font-bold text-slate-300 tracking-[0.12em] mt-0.5 flex-shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{g.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{g.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500 leading-relaxed">
          Violations of these guidelines may result in content removal or account suspension. To report a violation, contact us at{" "}
          <a href="mailto:support@studycircle.app" className="text-teal-600 hover:underline">support@studycircle.app</a>.
        </p>
      </div>
    </main>
  );
}

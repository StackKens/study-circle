export function meta() {
  return [{ title: "Terms of Service · StudyCircle" }];
}

export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Legal</p>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Terms of Service</h1>
      <p className="text-slate-400 text-sm mb-12">Last updated: January 2026</p>

      <div className="space-y-10 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
          <p>By creating an account on StudyCircle, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">2. Eligibility</h2>
          <p>StudyCircle is intended for university students. By registering, you confirm that you are currently enrolled at or affiliated with a university or higher education institution.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">3. Acceptable Use</h2>
          <p>You agree not to use StudyCircle to share illegal, harmful, or copyrighted content without permission. You are responsible for all content you upload or share on the platform. Harassment, spam, or abuse of other users will result in account termination.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">4. Intellectual Property</h2>
          <p>Content you upload remains yours. By uploading, you grant StudyCircle a limited license to display and distribute that content within the platform to members of your study groups.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">5. Account Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from your profile settings.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">6. Limitation of Liability</h2>
          <p>StudyCircle is provided as-is. We are not liable for any loss of data, academic outcomes, or damages arising from use of the platform.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">7. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">8. Contact</h2>
          <p>Questions about these terms? Reach us at <a href="mailto:legal@studycircle.app" className="text-teal-600 hover:underline">legal@studycircle.app</a>.</p>
        </section>
      </div>
    </main>
  );
}

export function meta() {
  return [{ title: "Privacy Policy · StudyCircle" }];
}

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Legal</p>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-slate-400 text-sm mb-12">Last updated: January 2026</p>

      <div className="prose prose-slate max-w-none space-y-10 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
          <p>When you create an account on StudyCircle, we collect your name, email address, university, course, and year of study. We also collect content you upload such as resources, session details, and profile information including your profile photo.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve the StudyCircle platform — including matching you with relevant study groups, displaying your profile to other students, and enabling collaboration features. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">3. Data Storage</h2>
          <p>Your account data is stored securely in our database. Profile photos and uploaded files are stored via Cloudinary. We use industry-standard security practices including password hashing and JWT-based authentication.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">4. Cookies</h2>
          <p>StudyCircle uses local storage to maintain your login session. We do not use third-party tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">5. Your Rights</h2>
          <p>You may request deletion of your account and associated data at any time by contacting us. You can update your profile information directly from your dashboard.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">6. Contact</h2>
          <p>For any privacy-related questions, contact us at <a href="mailto:privacy@studycircle.app" className="text-teal-600 hover:underline">privacy@studycircle.app</a>.</p>
        </section>
      </div>
    </main>
  );
}

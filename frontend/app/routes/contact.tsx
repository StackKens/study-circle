import { useState } from "react";
import { Mail, MessageSquare, Send, Loader2, Check } from "lucide-react";

export function meta() {
  return [{ title: "Contact · StudyCircle" }];
}

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Opens default mail client with pre-filled content
    const mailto = `mailto:hello@studycircle.app?subject=${encodeURIComponent(formData.subject || "StudyCircle Enquiry")}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    window.location.href = mailto;

    setTimeout(() => {
      setSubmitted(true);
      setIsSubmitting(false);
    }, 800);
  };

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 transition-all";

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Get in touch</p>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Contact Us</h1>
      <p className="text-slate-500 text-sm leading-relaxed max-w-xl mb-16">
        Have a question, feedback, or want to partner with us? We'd love to hear from you.
      </p>

      <div className="grid md:grid-cols-5 gap-12">
        {/* Contact info */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail size={17} className="text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm mb-1">Email</p>
              <a href="mailto:hello@studycircle.app" className="text-sm text-teal-600 hover:underline">
                hello@studycircle.app
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare size={17} className="text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm mb-1">Support</p>
              <a href="mailto:support@studycircle.app" className="text-sm text-teal-600 hover:underline">
                support@studycircle.app
              </a>
              <p className="text-xs text-slate-400 mt-1">We respond within 24 hours</p>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 mt-8">
            <p className="text-sm font-semibold text-slate-800 mb-1">Based in Uganda</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              StudyCircle is built for university students across Uganda and beyond.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-3">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                <Check size={24} className="text-teal-600" />
              </div>
              <p className="font-semibold text-slate-900 mb-1">Message sent</p>
              <p className="text-sm text-slate-400">Your email client should have opened. We'll get back to you soon.</p>
              <button
                onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", subject: "", message: "" }); }}
                className="mt-6 text-sm text-teal-600 font-medium hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@university.ac.ug"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="What's this about?"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  placeholder="Tell us what's on your mind…"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <><Send size={14} /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

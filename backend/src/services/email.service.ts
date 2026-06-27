import sgMail from "@sendgrid/mail";

const SENDGRID_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@studycircle.app";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

if (SENDGRID_KEY) {
  try {
    sgMail.setApiKey(SENDGRID_KEY);
  } catch (err) {
    console.warn("SendGrid not configured properly", err);
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(
    token,
  )}`;

  const subject = "Verify your StudyCircle account";
  const text = `Verify your email by visiting: ${verifyUrl}`;
  const html = `<p>Please verify your StudyCircle account by clicking the link below:</p><p><a href="${verifyUrl}">Verify email</a></p><p>If you didn't create an account, ignore this email.</p>`;

  if (SENDGRID_KEY) {
    await sgMail.send({ to: email, from: FROM_EMAIL, subject, text, html });
    return;
  }

  // Fallback for development: log the verification URL
  console.log(`[email] verification link for ${email}: ${verifyUrl}`);
}

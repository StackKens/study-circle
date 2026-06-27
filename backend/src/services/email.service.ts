import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

const SENDGRID_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@studycircle.app";
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://studycircle-2026.netlify.app"
    : "http://localhost:5173");

const SMTP_HOST = process.env.SMTP_HOST?.trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS?.trim();

let smtpTransporter: nodemailer.Transporter | null = null;

if (SENDGRID_KEY) {
  try {
    sgMail.setApiKey(SENDGRID_KEY);
  } catch (err) {
    console.warn("SendGrid not configured properly", err);
  }
}

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(
    token,
  )}&email=${encodeURIComponent(email)}`;

  const subject = "Verify your StudyCircle account";
  const text = `Verify your email by visiting: ${verifyUrl}`;
  const html = `<p>Please verify your StudyCircle account by clicking the link below:</p><p><a href="${verifyUrl}">Verify email</a></p><p>If you didn't create an account, ignore this email.</p>`;

  if (smtpTransporter) {
    await smtpTransporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject,
      text,
      html,
    });
    return;
  }

  if (SENDGRID_KEY) {
    await sgMail.send({ to: email, from: FROM_EMAIL, subject, text, html });
    return;
  }

  // Fallback for development: log the verification URL
  console.log(`[email] verification link for ${email}: ${verifyUrl}`);
}

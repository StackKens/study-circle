import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import url from "url";
import pool from "../db/index";
import { sendVerificationEmail } from "../services/email.service";

//  Register
export async function register(req: Request, res: Response) {
  const {
    name,
    email,
    password,
    university,
    course,
    year_of_study,
    role,
    bio,
    department,
  } = req.body;

  // Basic validation — never trust the client
  if (!name || !email || !password || !university || !role) {
    res
      .status(400)
      .json({
        error: "Name, email, password, university, and role are required",
      });
    return;
  }

  if (role !== "student" && role !== "instructor") {
    res.status(400).json({ error: "Role must be student or instructor" });
    return;
  }

  if (role === "student" && (!course || !year_of_study)) {
    res
      .status(400)
      .json({ error: "Course and year of study are required for students" });
    return;
  }

  if (
    role === "instructor" &&
    (!department || !department.trim() || !bio || !bio.trim())
  ) {
    res
      .status(400)
      .json({ error: "Department and bio are required for instructors" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    // Check if email already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    // Hash the password — NEVER stored plain text
    const password_hash = await bcrypt.hash(password, 12);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, university, course, year_of_study)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, university, course, year_of_study, created_at`,
      [
        name,
        email.toLowerCase(),
        password_hash,
        university,
        course,
        year_of_study,
      ],
    );

    const user = result.rows[0];

    // If registering as instructor, create an instructors row with profile details
    if (role === "instructor") {
      await pool.query(
        `INSERT INTO instructors (user_id, bio, department)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           bio = EXCLUDED.bio,
           department = EXCLUDED.department`,
        [user.id, bio?.trim() || null, department?.trim() || null],
      );
    }

    // Create email verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await pool.query(
      `INSERT INTO email_verifications (token, user_id, expires_at) VALUES ($1, $2, $3)`,
      [token, user.id, expiresAt],
    );

    // Send verification email (best-effort)
    let emailSent = false;
    try {
      await sendVerificationEmail(user.email, token);
      emailSent = true;
    } catch (e) {
      console.error("Failed to send verification email", e);
    }

    const FRONTEND_URL =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://studycircle-2026.netlify.app"
        : "http://localhost:5173");
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;

    // Create JWT token for immediate use (still unverified)
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        university: user.university,
        avatar_url: user.avatar_url || null,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }, // token expires in 7 days
    );

    res.status(201).json({ token: jwtToken, user, verificationLink, emailSent });
  } catch (err: any) {
    console.error("=== REGISTER ERROR ===");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
}

//  Login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    // Find user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = result.rows[0];

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Create token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        university: user.university,
        avatar_url: user.avatar_url || null,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    // Never send password_hash
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

//  Get current user
export async function getMe(req: any, res: Response) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, university, course, year_of_study, created_at, avatar_url, is_email_verified
       FROM users WHERE id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Resend verification email
export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const userRes = await pool.query(
      `SELECT id, is_email_verified FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const user = userRes.rows[0];
    if (user.is_email_verified) {
      res.status(400).json({ error: "Email already verified" });
      return;
    }

    // Create new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO email_verifications (token, user_id, expires_at) VALUES ($1, $2, $3)`,
      [token, user.id, expiresAt],
    );
    let emailSent = false;
    try {
      await sendVerificationEmail(email.toLowerCase(), token);
      emailSent = true;
    } catch (e) {
      console.error("Failed to send verification email", e);
    }

    const FRONTEND_URL =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://studycircle-2026.netlify.app"
        : "http://localhost:5173");
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.toLowerCase())}`;

    res.json({ ok: true, verificationLink, emailSent });
  } catch (err) {
    console.error("resendVerification error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Verify email token
export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  try {
    const v = await pool.query(
      `SELECT user_id, expires_at FROM email_verifications WHERE token = $1`,
      [token],
    );
    if (v.rows.length === 0) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }
    const { user_id, expires_at } = v.rows[0];
    if (new Date(expires_at).getTime() < Date.now()) {
      await pool.query(`DELETE FROM email_verifications WHERE token = $1`, [
        token,
      ]);
      res.status(400).json({ error: "Token expired" });
      return;
    }

    await pool.query(
      `UPDATE users SET is_email_verified = TRUE WHERE id = $1`,
      [user_id],
    );
    await pool.query(`DELETE FROM email_verifications WHERE token = $1`, [
      token,
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("verifyEmail error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

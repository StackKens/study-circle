import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/index";

//  Register
export async function register(req: Request, res: Response) {
  const { name, email, password, university, course, year_of_study } = req.body;

  // Basic validation — never trust the client
  if (
    !name ||
    !email ||
    !password ||
    !university ||
    !course ||
    !year_of_study
  ) {
    res.status(400).json({ error: "All fields are required" });
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

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }, // token expires in 7 days
    );

    res.status(201).json({ token, user });
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
      { id: user.id, email: user.email },
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
      `SELECT id, name, email, university, course, year_of_study, created_at
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

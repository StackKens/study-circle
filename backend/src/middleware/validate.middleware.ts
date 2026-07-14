import { Response } from "express";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(value: string): boolean {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeString(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

export function requireFields(
  res: Response,
  fields: Record<string, unknown>,
): boolean {
  const missing = Object.entries(fields)
    .filter(([, v]) => v === undefined || v === null || v === "")
    .map(([k]) => k);
  if (missing.length > 0) {
    res
      .status(400)
      .json({ error: `Missing required fields: ${missing.join(", ")}` });
    return false;
  }
  return true;
}

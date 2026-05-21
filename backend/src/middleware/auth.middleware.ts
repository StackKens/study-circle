import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include user
// This means req.user is available in all protected routes
export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  // Token comes in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };
    // Attach user info to the request object
    // Now every controller can access req.user.id
    req.user = decoded;
    next(); // pass control to the next function — the controller
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

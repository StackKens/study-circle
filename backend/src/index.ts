import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Load .env before anything else
dotenv.config();

import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import sessionRoutes from "./routes/sessions";
import resourceRoutes from "./routes/resources";
import userRoutes from "./routes/users";
import friendRoutes from "./routes/friends";
import notificationRoutes from "./routes/notifications";
import courseRoutes from "./routes/courses";
import announcementRoutes from "./routes/announcements";
import courseResourceRoutes from "./routes/course-resources";
import assignmentRoutes from "./routes/assignments";
import discussionRoutes from "./routes/discussions";
import messageRoutes from "./routes/messages";

import { createServer } from "http";
import { initChat, ensureGeneralTable } from "./sockets/chat.socket";
import { initDatabase } from "./db/init";

const app = express();
const PORT = parseInt(process.env.PORT || "5000");

//  Middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb" }));

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        process.env.FRONTEND_URL || "https://studycircle-2026.netlify.app",
        /\.netlify\.app$/,
      ]
    : [/^http:\/\/localhost:\d+$/];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});
app.use(limiter);

// Stricter rate limits for auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login/register attempts, please try again later",
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Disable caching for all API responses by default
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Allow short-lived caching for public, rarely-changing data
const publicCacheMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  next();
};

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", courseRoutes);
app.use("/api", announcementRoutes);
app.use("/api", courseResourceRoutes);
app.use("/api", assignmentRoutes);
app.use("/api", discussionRoutes);
app.use("/api/messages", messageRoutes);

//  Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

//  404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const httpServer = createServer(app);
initChat(httpServer);

async function startServer() {
  try {
    await initDatabase();
    console.log("Database initialized successfully");
    await ensureGeneralTable();
    console.log("General chat table verified");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

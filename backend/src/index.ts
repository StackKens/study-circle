import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load .env before anything else
dotenv.config();

import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import sessionRoutes from "./routes/sessions";
import resourceRoutes from "./routes/resources";
import userRoutes from "./routes/users";
import friendRoutes from "./routes/friends";
import notificationRoutes from "./routes/notifications";

const app = express();
const PORT = parseInt(process.env.PORT || "5000");

//  Middleware
app.use(express.json());

const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || "https://studycircle2026.netlify.app"
    : "http://localhost:5173";

app.use(cors({ origin: allowedOrigin, credentials: true }));

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);

//  Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

//  404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

//  Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

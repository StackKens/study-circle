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

const app = express();
const PORT = process.env.PORT || 5000;

//  Middleware
app.use(express.json());

// CORS — allow your React frontend to call this API
// In development allow localhost:5173
// In production allow your Vercel URL
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:5173",
    credentials: true,
  }),
);

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);

//  Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

//  404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

//  Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

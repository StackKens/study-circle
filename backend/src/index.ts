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

const app = express();
const PORT = process.env.PORT || 5000;

//  Middleware
app.use(express.json());

// Validates FRONTEND_URL is a proper http/https origin
const getAllowedOrigin = () => {
  if (process.env.NODE_ENV !== "production") return "http://localhost:5173";
  const url = process.env.FRONTEND_URL;
  if (!url) throw new Error("FRONTEND_URL env var is required in production");
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      throw new Error("FRONTEND_URL must use http or https");
    return parsed.origin;
  } catch {
    throw new Error(`Invalid FRONTEND_URL: ${url}`);
  }
};

app.use(
  cors({
    origin: getAllowedOrigin(),
    credentials: true,
  }),
);

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);

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

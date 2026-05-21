import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Pool keeps multiple connections open and reuses them
// Much faster than opening a new connection per request
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // In production will use SSL
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test the connection when the server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Database connected successfully");
    release(); // return connection back to the pool
  }
});

export default pool;

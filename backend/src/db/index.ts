import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const sslConfig =
  process.env.NODE_ENV === "production"
    ? {
        rejectUnauthorized: false,
      }
    : false;

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        // Railway gives a single connection string — use it directly
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
      }
    : {
        // Local development — uses separate variables
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: false,
      },
);

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Database connected successfully");
    release();
  }
});

export default pool;

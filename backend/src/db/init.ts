import pool from "./index";
import fs from "fs";
import path from "path";

function findSqlFile(filename: string): string {
  const paths = [
    path.join(__dirname, filename),
    path.join(__dirname, "../../src/db", filename),
    path.join(__dirname, "../../../src/db", filename),
    path.resolve(process.cwd(), "src/db", filename),
    path.resolve(process.cwd(), "backend/src/db", filename)
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error(`Could not locate SQL file: ${filename}`);
}

function findMigrationsDir(): string {
  const paths = [
    path.join(__dirname, "migrations"),
    path.join(__dirname, "../../src/db/migrations"),
    path.join(__dirname, "../../../src/db/migrations"),
    path.resolve(process.cwd(), "src/db/migrations"),
    path.resolve(process.cwd(), "backend/src/db/migrations")
  ];
  for (const p of paths) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p;
    }
  }
  throw new Error("Could not locate migrations directory");
}

export async function initDatabase() {
  console.log("Database initialization started...");

  try {
    // 1. Run schema.sql to create base tables
    const schemaPath = findSqlFile("schema.sql");
    console.log(`Loading base schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schemaSql);
    console.log("Base schema tables created/verified successfully.");

    // 2. Run all migration scripts in order
    const migrationsDir = findMigrationsDir();
    console.log(`Loading migrations from: ${migrationsDir}`);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort(); // Sort alphabetically to run 006, 007, etc. in order

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");
      await pool.query(sql);
      console.log(`Migration ${file} executed successfully.`);
    }

    console.log("Database schema and migrations initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}


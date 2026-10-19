
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured in .env.local");
}

const pool = new Pool({
  connectionString,
  max: 10,
});

export default pool;

import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

// Parse connection string
const connectionString = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL || 
  "mysql://root:password@localhost:3306/vebtask";

console.log('Database connection configured:', !!connectionString);

// Parse MySQL URL
const url = new URL(connectionString);
const dbConfig = {
  host: url.hostname,
  port: url.port ? parseInt(url.port) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
};

console.log('DB Config:', { ...dbConfig, password: '***' });

export const auth = betterAuth({
  database: createPool(dbConfig),
  baseURL: (process.env.BETTER_AUTH_URL || process.env.VITE_APP_URL || "http://localhost:3001") + "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || "test-secret-key-for-debugging",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:3001",
    "https://vebtask.com",
    "https://www.vebtask.com",
    "https://vebtask-production.up.railway.app"
  ],
});

console.log('✅ Basic auth instance created successfully');
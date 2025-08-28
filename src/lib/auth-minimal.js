import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

// Parse connection string into components
const connectionString = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL || 
  "mysql://root:password@localhost:3306/vebtask";

console.log('Minimal Auth config - baseURL:', process.env.VITE_APP_URL || process.env.VITE_APP_URL || "http://localhost:5173");
console.log('Minimal Auth config - database connection string configured:', !!connectionString);

// Parse MySQL URL into connection options
const url = new URL(connectionString);
const dbConfig = {
  host: url.hostname,
  port: url.port ? parseInt(url.port) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1), // Remove leading slash
};

console.log('DB Config:', { ...dbConfig, password: '***' });

export const auth = betterAuth({
  database: createPool(dbConfig),
  baseURL: process.env.BETTER_AUTH_URL || process.env.VITE_APP_URL || "http://localhost:5173",
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-key-change-in-production",
  advanced: {
    generateId: () => {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:3001", 
    "https://vebtask-production.up.railway.app"
  ],
});
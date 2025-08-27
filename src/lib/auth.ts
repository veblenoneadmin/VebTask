import { betterAuth } from "better-auth";
import Database from "better-auth/adapters/mysql2";

// Use Railway's internal MySQL URL for server-side connections
const connectionString = process.env.DATABASE_URL || 
  import.meta.env.VITE_DATABASE_URL || 
  "mysql://root:password@localhost:3306/vebtask";

console.log('Auth config - baseURL:', process.env.VITE_APP_URL || import.meta.env.VITE_APP_URL || "http://localhost:5173");
console.log('Auth config - database connection string configured:', !!connectionString);

export const auth = betterAuth({
  database: Database(connectionString),
  baseURL: process.env.VITE_APP_URL || import.meta.env.VITE_APP_URL || "http://localhost:5173",
  advanced: {
    generateId: () => {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Instant registration like you requested
    async sendResetPassword(data, request) {
      // TODO: Implement email sending for password reset
      console.log("Password reset requested for:", data.user.email);
    },
  },
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string", 
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:3001", 
    "https://vebtask-production.up.railway.app"
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
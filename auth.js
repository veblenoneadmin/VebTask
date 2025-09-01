import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./src/lib/prisma.js";

console.log('✅ Using Prisma adapter for Better Auth');

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql"
  }),
  baseURL: (process.env.BETTER_AUTH_URL || process.env.VITE_APP_URL || "http://localhost:3001") + "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || "test-secret-key-for-debugging",
  
  // Authentication providers (Google OAuth disabled for now - can be added later)
  providers: [],
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
    maxPasswordLength: 128
  },
  
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieName: "vebtask.session"
  },
  
  // Trusted origins for CORS
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:3001",
    "http://localhost:3000",
    "https://vebtask.com",
    "https://www.vebtask.com",
    "https://vebtask-production.up.railway.app"
  ],
  
  // Advanced configuration
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === 'production' ? '.vebtask.com' : 'localhost'
    }
  },
  
  // Password reset configuration
  passwordReset: {
    enabled: true,
    expiresIn: 60 * 15, // 15 minutes
    sendResetPassword: async ({ user, token }) => {
      // This will be handled by our custom routes
      console.log(`Password reset requested for ${user.email}, token: ${token}`);
    }
  },
  
  // Email verification (disabled for now, but can be enabled later)
  emailVerification: {
    enabled: false,
    expiresIn: 60 * 60 * 24, // 24 hours
    sendVerificationEmail: async ({ user, token }) => {
      console.log(`Email verification for ${user.email}, token: ${token}`);
    }
  },
  
  // User configuration
  user: {
    modelName: "User",
    additionalFields: {
      activeOrgId: {
        type: "string",
        required: false
      }
    }
  },
  
  // Callbacks for custom logic
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 Sign in callback:', { userId: user.id, email: user.email, provider: account?.provider });
      return true;
    },
    async session({ session, token }) {
      // Add organization context to session
      if (token.activeOrgId) {
        session.activeOrgId = token.activeOrgId;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Add custom claims to JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    }
  },
  
  // Error handling
  onError(error, request) {
    console.error('🔐 Better-Auth Error:', {
      message: error.message,
      path: request?.url,
      method: request?.method,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  },
  
  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60 * 1000, // 1 minute
    max: 100 // requests per window
  }
});

console.log('✅ Better-auth instance created successfully');
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./src/lib/prisma.js";

console.log('✅ Using Prisma adapter for Better Auth');
console.log('🔐 Better Auth Config:', {
  baseURL: (process.env.BETTER_AUTH_URL || process.env.VITE_APP_URL || "http://localhost:3001") + "/api/auth",
  hasSecret: !!process.env.BETTER_AUTH_SECRET,
  environment: process.env.NODE_ENV
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
    // Custom field mappings for Better Auth compatibility
    useTrueUUID: true
  }),
  baseURL: (process.env.BETTER_AUTH_URL || process.env.VITE_APP_URL || "http://localhost:3001") + "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || "test-secret-key-for-debugging",
  
  // Authentication providers
  providers: [
    // Email/password provider is automatically added when emailAndPassword is enabled
  ],
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
  
  // Email verification
  emailVerification: {
    enabled: true,
    expiresIn: 60 * 60 * 24, // 24 hours
    sendVerificationEmail: async ({ user, token }) => {
      console.log(`📧 Sending verification email to ${user.email}, token: ${token}`);
      
      // Import nodemailer
      const nodemailer = await import('nodemailer');
      
      // Create SMTP transporter
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const verificationUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3009'}/api/auth/verify-email?token=${token}`;

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Verify your VebTask account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Welcome to VebTask! 🚀</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>Thank you for signing up! Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #6366f1, #8b5cf6); 
                        color: white; padding: 12px 24px; text-decoration: none; 
                        border-radius: 8px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${verificationUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't sign up for VebTask, please ignore this email.
            </p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${user.email}`);
      } catch (error) {
        console.error('❌ Failed to send verification email:', error);
        throw error;
      }
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
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { createPool } from "mysql2/promise";
import nodemailer from "nodemailer";

// Parse connection string into components
const connectionString = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL || 
  "mysql://root:password@localhost:3306/vebtask";

console.log('Auth config - baseURL:', process.env.VITE_APP_URL || "http://localhost:3001");
console.log('Auth config - database connection string configured:', !!connectionString);

// Temporarily comment out transporter to isolate issues
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.zoho.com',
//   port: process.env.SMTP_PORT || 465,
//   secure: true, // true for 465, false for other ports
//   auth: {
//     user: process.env.SMTP_USER || 'tony@opusautomations.com',
//     pass: process.env.SMTP_PASS || 'Opus2025#',
//   },
// });

// Parse MySQL URL into connection options
const url = new URL(connectionString);
const dbConfig = {
  host: url.hostname,
  port: url.port ? parseInt(url.port) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1), // Remove leading slash
};

export const auth = betterAuth({
  database: createPool(dbConfig),
  baseURL: (process.env.VITE_APP_URL || "http://localhost:3001") + "/api/auth",
  advanced: {
    generateId: () => {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`Sending ${type} OTP to ${email}: ${otp}`);
        
        // Always log OTP for development
        console.log(`DEV MODE - OTP for ${email}: ${otp}`);
        
        // For now, skip email sending to avoid potential SMTP errors
        // const subject = type === "sign-in" 
        //   ? "Sign in to VebTask" 
        //   : type === "email-verification" 
        //   ? "Verify your VebTask account"
        //   : "Reset your VebTask password";
          
        // const text = `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`;
        
        // try {
        //   await transporter.sendMail({
        //     from: process.env.SMTP_FROM || '"VebTask" <tony@opusautomations.com>',
        //     to: email,
        //     subject: subject,
        //     text: text,
        //     html: `
        //       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        //         <h2 style="color: #333;">${subject}</h2>
        //         <p>Your verification code is:</p>
        //         <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
        //           ${otp}
        //         </div>
        //         <p style="color: #666;">This code expires in 5 minutes.</p>
        //         <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        //       </div>
        //     `,
        //   });
        //   console.log(`Email sent successfully to ${email}`);
        // } catch (error) {
        //   console.error('Email sending failed:', error);
        //   // For development, just log the OTP instead of failing
        //   console.log(`DEV MODE - OTP for ${email}: ${otp}`);
        //   // Don't throw error to prevent 500 response
        // }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
  ],
  emailAndPassword: {
    enabled: true, // Enable this for OTP to work properly
    requireEmailVerification: false,
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
    "http://localhost:8080",
    "http://localhost:3001", 
    "https://vebtask-production.up.railway.app"
  ],
});
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
  // Add connection timeout and retry settings
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

console.log('DB Config:', { ...dbConfig, password: '***' });

// Create database pool with error handling
const dbPool = createPool(dbConfig);

// Test database connection
dbPool.getConnection()
  .then(connection => {
    console.log('✅ Database connection test successful');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Database connection test failed:', error.message);
  });

export const auth = betterAuth({
  database: dbPool,
  baseURL: (process.env.BETTER_AUTH_URL || process.env.VITE_APP_URL || "http://localhost:3001") + "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || "test-secret-key-for-debugging",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Add password strength requirements
    minPasswordLength: 6,
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
  // Add error handling
  onError(error, request) {
    console.error('🔐 Better-Auth Error:', {
      message: error.message,
      path: request?.url,
      method: request?.method,
      stack: error.stack
    });
  },
});

console.log('✅ Better-auth instance created successfully');
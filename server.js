import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting server...');

// CORS headers
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:3001',
    'https://vebtask.com',
    'https://www.vebtask.com',
    'https://vebtask-production.up.railway.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Auth routes using proper Express adapter
app.all('/api/auth/*', toNodeHandler(auth));

// Mount express json middleware AFTER Better Auth handler
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', auth: 'better-auth working' });
});

// Database initialization endpoint (for production)
app.post('/api/init-db', async (req, res) => {
  try {
    const { createPool } = await import('mysql2/promise');
    
    const connectionString = process.env.DATABASE_URL || 
      process.env.VITE_DATABASE_URL || 
      "mysql://root:password@localhost:3306/vebtask";

    const url = new URL(connectionString);
    const dbConfig = {
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
    };

    const pool = createPool(dbConfig);

    console.log('🔄 Initializing database tables...');
    
    // Drop existing tables in correct order (reverse foreign key dependency)
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('DROP TABLE IF EXISTS verification');
    await pool.execute('DROP TABLE IF EXISTS session');  
    await pool.execute('DROP TABLE IF EXISTS account');
    await pool.execute('DROP TABLE IF EXISTS user');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Create user table
    await pool.execute(`
      CREATE TABLE user (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        emailVerified BOOLEAN DEFAULT FALSE,
        name VARCHAR(255),
        image VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create session table
    await pool.execute(`
      CREATE TABLE session (
        id VARCHAR(255) PRIMARY KEY,
        expiresAt TIMESTAMP NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        userId VARCHAR(36) NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    // Create account table
    await pool.execute(`
      CREATE TABLE account (
        id VARCHAR(36) PRIMARY KEY,
        accountId VARCHAR(255) NOT NULL,
        providerId VARCHAR(255) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt TIMESTAMP NULL,
        refreshTokenExpiresAt TIMESTAMP NULL,
        scope TEXT,
        password VARCHAR(255),
        salt VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
        UNIQUE KEY unique_provider_account (providerId, accountId)
      )
    `);

    // Create verification table
    await pool.execute(`
      CREATE TABLE verification (
        id VARCHAR(36) PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.end();

    console.log('✅ Database initialized successfully');
    res.json({ success: true, message: 'Database initialized successfully' });
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 Auth endpoints available at /api/auth/*`);
  console.log(`📱 React app available at /`);
});
import { createPool } from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL || 
  "mysql://root:password@localhost:3306/vebtask";

console.log('🔗 Connecting to database...');

// Parse MySQL URL
const url = new URL(connectionString);
const dbConfig = {
  host: url.hostname,
  port: url.port ? parseInt(url.port) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
};

console.log('📋 Database Config:', { ...dbConfig, password: '***' });

const pool = createPool(dbConfig);

async function initDatabase() {
  try {
    console.log('🔄 Dropping and recreating tables for fresh schema...');
    
    // Drop existing tables in correct order (reverse foreign key dependency)
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('DROP TABLE IF EXISTS verification');
    await pool.execute('DROP TABLE IF EXISTS session');  
    await pool.execute('DROP TABLE IF EXISTS account');
    await pool.execute('DROP TABLE IF EXISTS user');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🗑️ Dropped existing tables');

    // Create user table for better-auth with correct schema
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
    console.log('✅ Created user table');

    // Create session table for better-auth
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
    console.log('✅ Created session table');

    // Create account table for better-auth with proper schema
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
    console.log('✅ Created account table');

    // Create verification table for better-auth
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
    console.log('✅ Created verification table');

    console.log('🎉 Database initialization completed successfully!');
    
    // Test the connection
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM user');
    console.log(`📊 Current user count: ${rows[0].count}`);

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initDatabase().catch(console.error);
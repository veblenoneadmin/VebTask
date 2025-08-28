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
    // For auth routes, never use wildcard with credentials
    if (req.path.startsWith('/api/auth')) {
      res.header('Access-Control-Allow-Origin', 'http://localhost:5175');
    } else {
      res.header('Access-Control-Allow-Origin', 'http://localhost:5175');
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Mount express json middleware BEFORE auth routes for request logging
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Add logging middleware for auth routes
app.use('/api/auth/*', (req, res, next) => {
  console.log(`🔐 Auth ${req.method} ${req.path}`, {
    body: req.method === 'POST' ? req.body : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers.origin,
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    }
  });
  next();
});

// Auth routes using proper Express adapter with error handling
app.all('/api/auth/*', async (req, res, next) => {
  try {
    await toNodeHandler(auth)(req, res, next);
  } catch (error) {
    console.error('❌ Auth handler error:', {
      path: req.path,
      method: req.method,
      error: error.message,
      stack: error.stack
    });
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Authentication error', 
        message: error.message,
        path: req.path 
      });
    }
  }
});

// AI Processing API endpoint (secure server-side OpenRouter proxy)
app.post('/api/ai/process-brain-dump', async (req, res) => {
  try {
    const { content, timestamp } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

    // If no API key, fallback to simulation
    if (!OPENROUTER_API_KEY) {
      console.warn('OpenRouter API key not found, using simulation fallback');
      const result = simulateAIProcessing(content);
      return res.status(200).json(result);
    }

    console.log('🤖 Processing brain dump with GPT-5 Nano...');

    // Call OpenRouter API securely from server
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [{
          role: 'system',
          content: getAISystemPrompt()
        }, {
          role: 'user', 
          content: content
        }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      // Fallback to simulation on API error
      const result = simulateAIProcessing(content);
      return res.status(200).json(result);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(aiResponse);
      const result = {
        ...parsed,
        processingTimestamp: new Date().toISOString(),
        aiModel: 'gpt-5-nano'
      };
      
      console.log('✅ Brain dump processed successfully with AI');
      return res.status(200).json(result);
    } catch (parseError) {
      console.warn('AI response not valid JSON, falling back to simulation');
      const result = simulateAIProcessing(content);
      return res.status(200).json(result);
    }

  } catch (error) {
    console.error('❌ AI processing error:', error);
    
    // Always provide fallback simulation on error
    try {
      const result = simulateAIProcessing(req.body.content || '');
      return res.status(200).json(result);
    } catch (fallbackError) {
      return res.status(500).json({ error: 'AI processing failed' });
    }
  }
});

// AI helper functions
function getAISystemPrompt() {
  return `You are an AI assistant specialized in analyzing brain dumps and extracting actionable tasks. 

Your job is to:
1. Parse unstructured text/thoughts into organized, actionable tasks
2. Assign appropriate priorities (urgent, high, medium, low)
3. Estimate time requirements in hours
4. Categorize tasks by type (development, design, testing, etc.)
5. Extract relevant tags and keywords
6. Break complex tasks into micro-tasks when appropriate

Return a JSON object with this structure:
{
  "originalContent": "...",
  "extractedTasks": [{
    "id": "unique-id",
    "title": "Clear task title (max 50 chars)",
    "description": "Detailed description",
    "priority": "urgent|high|medium|low",
    "estimatedHours": 2.5,
    "category": "development|design|testing|research|documentation|meeting|deployment|general",
    "tags": ["tag1", "tag2"],
    "microTasks": ["subtask 1", "subtask 2"]
  }],
  "summary": "Brief summary of identified tasks"
}

Be practical and actionable in your task extraction. Return ONLY the JSON object, no additional text.`;
}

function simulateAIProcessing(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const tasks = [];
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) return;
    
    if (isTaskLike(trimmedLine)) {
      const priority = determinePriority(trimmedLine);
      const estimatedTime = Math.random() * 4 + 1;
      
      tasks.push({
        id: generateSimpleId(),
        title: extractSimpleTitle(trimmedLine),
        description: trimmedLine,
        priority,
        estimatedHours: Math.round(estimatedTime * 10) / 10,
        category: 'general',
        tags: [],
        microTasks: []
      });
    }
  });

  if (tasks.length === 0) {
    tasks.push({
      id: generateSimpleId(),
      title: extractSimpleTitle(content.substring(0, 50)),
      description: content,
      priority: 'medium',
      estimatedHours: 2,
      category: 'general',
      tags: [],
      microTasks: []
    });
  }

  return {
    originalContent: content,
    extractedTasks: tasks,
    summary: `Identified ${tasks.length} actionable tasks. Estimated total time: ${Math.round(tasks.reduce((sum, task) => sum + task.estimatedHours, 0) * 10) / 10} hours.`,
    processingTimestamp: new Date().toISOString(),
    aiModel: 'simulation-fallback'
  };
}

function isTaskLike(text) {
  const taskIndicators = [
    'need to', 'have to', 'should', 'must', 'create', 'build', 'implement',
    'fix', 'update', 'review', 'test', 'deploy', 'setup', 'configure',
    'design', 'research', 'analyze', 'write', 'document', 'plan'
  ];
  
  const lowerText = text.toLowerCase();
  return taskIndicators.some(indicator => lowerText.includes(indicator));
}

function determinePriority(text) {
  const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
  const highWords = ['important', 'priority', 'soon', 'deadline'];
  
  const lowerText = text.toLowerCase();
  
  if (urgentWords.some(word => lowerText.includes(word))) return 'urgent';
  if (highWords.some(word => lowerText.includes(word))) return 'high';
  if (lowerText.includes('low priority') || lowerText.includes('when time')) return 'low';
  
  return 'medium';
}

function extractSimpleTitle(text) {
  const cleaned = text.replace(/[^\w\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/).slice(0, 6);
  return words.join(' ').substring(0, 50);
}

function generateSimpleId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint for Railway
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { createPool } = await import('mysql2/promise');
    const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    
    if (connectionString) {
      const url = new URL(connectionString);
      const pool = createPool({
        host: url.hostname,
        port: url.port ? parseInt(url.port) : 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        acquireTimeout: 10000
      });
      
      const [rows] = await pool.execute('SELECT 1 as test');
      await pool.end();
      
      res.json({ 
        status: 'ok', 
        auth: 'better-auth working',
        database: 'connected',
        tables_check: 'run /api/check-db for details'
      });
    } else {
      res.json({ 
        status: 'ok', 
        auth: 'better-auth working',
        database: 'no connection string'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      auth: 'better-auth working',
      database: 'connection failed',
      error: error.message
    });
  }
});

// Database check endpoint
app.get('/api/check-db', async (req, res) => {
  try {
    const { createPool } = await import('mysql2/promise');
    const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    
    if (!connectionString) {
      return res.json({ error: 'No database connection string' });
    }
    
    const url = new URL(connectionString);
    const pool = createPool({
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1)
    });
    
    // Check if tables exist
    const [tables] = await pool.execute("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    const checks = {};
    for (const tableName of ['user', 'account', 'session', 'verification']) {
      if (tableNames.includes(tableName)) {
        const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
        const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        checks[tableName] = {
          exists: true,
          columns: columns.map(col => col.Field),
          count: count[0].count
        };
      } else {
        checks[tableName] = { exists: false };
      }
    }
    
    await pool.end();
    
    res.json({
      database: 'connected',
      tables: checks,
      allTables: tableNames
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Database check failed',
      message: error.message
    });
  }
});

// User cleanup/reset endpoint for debugging
app.post('/api/reset-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const { createPool } = await import('mysql2/promise');
    const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    
    if (!connectionString) {
      return res.status(500).json({ error: 'No database connection' });
    }
    
    const url = new URL(connectionString);
    const pool = createPool({
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1)
    });

    // Check if user exists
    const [users] = await pool.execute('SELECT id, email, name FROM user WHERE email = ?', [email]);
    
    if (users.length === 0) {
      await pool.end();
      return res.json({ message: 'User not found', email });
    }

    const user = users[0];
    
    // Check account records
    const [accounts] = await pool.execute('SELECT * FROM account WHERE userId = ?', [user.id]);
    
    // Check session records
    const [sessions] = await pool.execute('SELECT * FROM session WHERE userId = ?', [user.id]);

    // Delete all related records for clean slate
    await pool.execute('DELETE FROM session WHERE userId = ?', [user.id]);
    await pool.execute('DELETE FROM account WHERE userId = ?', [user.id]);
    await pool.execute('DELETE FROM user WHERE id = ?', [user.id]);
    
    await pool.end();

    res.json({ 
      message: 'User and all related records deleted successfully', 
      email,
      deletedRecords: {
        user: 1,
        accounts: accounts.length,
        sessions: sessions.length
      }
    });
    
  } catch (error) {
    console.error('❌ User reset error:', error);
    res.status(500).json({ error: error.message });
  }
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
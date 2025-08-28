import { createConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL || 
  "mysql://root:password@localhost:3306/vebtask";

console.log('Database connection string configured:', !!connectionString);

// Parse MySQL URL into connection options
const url = new URL(connectionString);
const dbConfig = {
  host: url.hostname,
  port: url.port ? parseInt(url.port) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1), // Remove leading slash
  multipleStatements: true
};

console.log('DB Config:', { ...dbConfig, password: '***' });

async function initializeDatabase() {
  let connection;
  
  try {
    // First connect without specifying database
    const baseConfig = { ...dbConfig };
    delete baseConfig.database;
    
    connection = await createConnection(baseConfig);
    console.log('Connected to MySQL server');
    
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'database-init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing database initialization...');
    const [results] = await connection.execute(sql);
    console.log('✅ Database initialization completed successfully!');
    console.log('Results:', results);
    
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied - check your database credentials');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to database server - check host and port');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

initializeDatabase();
import { createPool } from 'mysql2/promise';
import { URL } from 'url';

const connectionString = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/vebtask";

async function fixCalendarSchema() {
  let pool;
  try {
    console.log('🔗 Connecting to database...');
    
    // Parse connection string
    const url = new URL(connectionString);
    const config = {
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1)
    };
    
    pool = createPool(config);
    
    console.log('🔧 Adding missing columns to calendar_events table...');
    
    // Add status column if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE calendar_events 
        ADD COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled'
      `);
      console.log('✅ Added status column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Status column already exists');
      } else {
        throw error;
      }
    }
    
    // Add other missing columns if needed
    try {
      await pool.execute(`
        ALTER TABLE calendar_events 
        ADD COLUMN color VARCHAR(7) DEFAULT '#6366f1'
      `);
      console.log('✅ Added color column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Color column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE calendar_events 
        ADD COLUMN location VARCHAR(255)
      `);
      console.log('✅ Added location column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Location column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE calendar_events 
        ADD COLUMN attendees JSON
      `);
      console.log('✅ Added attendees column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Attendees column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE calendar_events 
        ADD COLUMN isRecurring BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added isRecurring column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ IsRecurring column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE calendar_events 
        ADD COLUMN recurringPattern JSON
      `);
      console.log('✅ Added recurringPattern column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ RecurringPattern column already exists');
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Calendar schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing calendar schema:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

fixCalendarSchema();
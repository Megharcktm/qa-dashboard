import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function initializeDatabase(dbPath: string): Database.Database {
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Open or create database
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Load and execute schema
  const schemaPath = path.join(__dirname, '../models/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (error) {
      console.error('Error executing schema statement:', statement);
      console.error('Error:', error);
      throw error;
    }
  }

  // Run migrations - add missing columns if they don't exist
  try {
    // Check if automated_test column exists
    const tableInfo = db.prepare("PRAGMA table_info(tickets)").all() as any[];
    const hasAutomatedTestColumn = tableInfo.some(col => col.name === 'automated_test');

    if (!hasAutomatedTestColumn) {
      console.log('Adding automated_test column to tickets table...');
      db.exec('ALTER TABLE tickets ADD COLUMN automated_test TEXT');
      console.log('✓ Added automated_test column');
    }
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }

  console.log(`✓ Database initialized at ${dbPath}`);

  return db;
}

export function getDatabase(dbPath?: string): Database.Database {
  const path_to_db = dbPath || process.env.DATABASE_PATH || './data/qa_dashboard.db';
  return initializeDatabase(path_to_db);
}

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Set NODE_ENV if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Enhanced database connection with proper pooling and error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 20 : 5, // Connection pool limits
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased timeout
  maxUses: 7500, // Rotate connections
});

// Handle pool errors gracefully without crashing
pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
  // Don't exit process, just log the error
});

// Handle connection errors
pool.on('connect', (client) => {
  console.log('✓ Database connected successfully');
});

export const db = drizzle({ client: pool, schema });
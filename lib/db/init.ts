import { sql } from "./neon-client"

/**
 * Check if database tables exist
 */
export async function checkTablesExist(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_batches'
      ) as exists
    `
    return result[0]?.exists === true
  } catch (error) {
    console.error("[v0] Error checking if tables exist:", error)
    return false
  }
}

/**
 * Initialize database schema
 * Creates all necessary tables, indexes, and triggers
 */
export async function initializeDatabase(): Promise<void> {
  console.log("[v0] Initializing database schema...")

  try {
    // Enable extensions
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`

    // Create product_batches table
    await sql`
      CREATE TABLE IF NOT EXISTS product_batches (
        id TEXT PRIMARY KEY,
        product_name TEXT NOT NULL,
        distributor TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_by TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create product_codes table
    await sql`
      CREATE TABLE IF NOT EXISTS product_codes (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
        label_hash TEXT NOT NULL UNIQUE,
        verification_hash TEXT NOT NULL UNIQUE,
        blockchain_anchor_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'UNUSED' CHECK (status IN ('UNUSED', 'TERVERIFIKASI', 'PERNAH_TERVERIFIKASI')),
        verification_count INTEGER NOT NULL DEFAULT 0,
        first_verified_at TIMESTAMPTZ,
        last_verified_at TIMESTAMPTZ,
        verification_history JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create blockchain_blocks table
    await sql`
      CREATE TABLE IF NOT EXISTS blockchain_blocks (
        index INTEGER PRIMARY KEY,
        hash TEXT NOT NULL UNIQUE,
        previous_hash TEXT NOT NULL,
        merkle_root TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        date DATE NOT NULL,
        nonce INTEGER NOT NULL,
        events JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    // Create pending_anchors table
    await sql`
      CREATE TABLE IF NOT EXISTS pending_anchors (
        date DATE PRIMARY KEY,
        events JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create audit_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        code TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('TERVERIFIKASI', 'PERNAH_TERVERIFIKASI', 'TIDAK_TERVERIFIKASI')),
        ip_hash TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT,
        distributor TEXT,
        code_id TEXT,
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_product_codes_batch_id ON product_codes(batch_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_product_codes_label_hash ON product_codes(label_hash)`
    await sql`CREATE INDEX IF NOT EXISTS idx_product_codes_verification_hash ON product_codes(verification_hash)`
    await sql`CREATE INDEX IF NOT EXISTS idx_product_codes_blockchain_anchor_hash ON product_codes(blockchain_anchor_hash)`
    await sql`CREATE INDEX IF NOT EXISTS idx_product_codes_status ON product_codes(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_hash ON blockchain_blocks(hash)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_date ON blockchain_blocks(date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_merkle_root ON blockchain_blocks(merkle_root)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_code ON audit_logs(code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_product_id ON audit_logs(product_id)`

    // Create trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `

    // Create triggers
    await sql`
      DROP TRIGGER IF EXISTS update_product_batches_updated_at ON product_batches;
      CREATE TRIGGER update_product_batches_updated_at
        BEFORE UPDATE ON product_batches
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `

    await sql`
      DROP TRIGGER IF EXISTS update_product_codes_updated_at ON product_codes;
      CREATE TRIGGER update_product_codes_updated_at
        BEFORE UPDATE ON product_codes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `

    await sql`
      DROP TRIGGER IF EXISTS update_pending_anchors_updated_at ON pending_anchors;
      CREATE TRIGGER update_pending_anchors_updated_at
        BEFORE UPDATE ON pending_anchors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `

    console.log("[v0] Database schema initialized successfully")
  } catch (error) {
    console.error("[v0] Error initializing database:", error)
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Ensure database is ready
 * Checks if tables exist and initializes if needed
 */
export async function ensureDatabaseReady(): Promise<void> {
  const tablesExist = await checkTablesExist()

  if (!tablesExist) {
    console.log("[v0] Database tables not found, initializing...")
    await initializeDatabase()
  } else {
    console.log("[v0] Database tables already exist")
  }
}

-- LACAK System Database Schema
-- This script creates the core tables for secure hash storage

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Product Batches Table
CREATE TABLE IF NOT EXISTS product_batches (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  distributor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Codes Table (stores all hash data securely)
CREATE TABLE IF NOT EXISTS product_codes (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
  
  -- Hash fields (encrypted at rest by Neon)
  label_hash TEXT NOT NULL UNIQUE,
  verification_hash TEXT NOT NULL UNIQUE,
  blockchain_anchor_hash TEXT NOT NULL,
  
  -- Verification state
  status TEXT NOT NULL DEFAULT 'UNUSED' CHECK (status IN ('UNUSED', 'TERVERIFIKASI', 'PERNAH_TERVERIFIKASI')),
  verification_count INTEGER NOT NULL DEFAULT 0,
  first_verified_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  
  -- Verification history (stored as JSONB for flexibility)
  verification_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata and timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain Blocks Table
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
);

-- Pending Blockchain Anchors Table (temporary storage for daily batching)
CREATE TABLE IF NOT EXISTS pending_anchors (
  date DATE PRIMARY KEY,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table (immutable audit trail)
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
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_codes_batch_id ON product_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_product_codes_label_hash ON product_codes(label_hash);
CREATE INDEX IF NOT EXISTS idx_product_codes_verification_hash ON product_codes(verification_hash);
CREATE INDEX IF NOT EXISTS idx_product_codes_blockchain_anchor_hash ON product_codes(blockchain_anchor_hash);
CREATE INDEX IF NOT EXISTS idx_product_codes_status ON product_codes(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_hash ON blockchain_blocks(hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_date ON blockchain_blocks(date);
CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_merkle_root ON blockchain_blocks(merkle_root);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_code ON audit_logs(code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_product_id ON audit_logs(product_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_product_batches_updated_at
  BEFORE UPDATE ON product_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_codes_updated_at
  BEFORE UPDATE ON product_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_anchors_updated_at
  BEFORE UPDATE ON pending_anchors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE product_batches IS 'Stores product batch information';
COMMENT ON TABLE product_codes IS 'Stores individual product codes with encrypted hashes';
COMMENT ON TABLE blockchain_blocks IS 'Stores mined blockchain blocks with Merkle roots';
COMMENT ON TABLE pending_anchors IS 'Temporary storage for daily blockchain event batching';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all verification attempts';

COMMENT ON COLUMN product_codes.label_hash IS 'SHA-256 hash of the product label code (16-char hex)';
COMMENT ON COLUMN product_codes.verification_hash IS 'SHA-256 hash of label_hash + VERIFICATION_SECRET';
COMMENT ON COLUMN product_codes.blockchain_anchor_hash IS 'SHA-256 hash of code_id + BLOCKCHAIN_SECRET';

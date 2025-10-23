import { sql } from "./neon-client"
import type { ProductBatch, ProductCode, VerificationHistoryEntry } from "@/lib/services/product-service"

export async function findBatchById(id: string): Promise<ProductBatch | null> {
  const batchRows = await sql`
    SELECT id, product_name, distributor, created_at
    FROM product_batches
    WHERE id = ${id}
  `

  if (batchRows.length === 0) {
    return null
  }

  const batch = batchRows[0]
  const codeRows = await sql`
    SELECT 
      id, label_hash, verification_hash, blockchain_anchor_hash,
      status, verification_count, first_verified_at, last_verified_at,
      verification_history
    FROM product_codes
    WHERE batch_id = ${id}
    ORDER BY id
  `

  return {
    id: batch.id as string,
    productName: batch.product_name as string,
    distributor: batch.distributor as string,
    createdAt: (batch.created_at as Date).toISOString(),
    codes: codeRows.map((row) => ({
      id: row.id as string,
      labelHash: row.label_hash as string,
      verificationHash: row.verification_hash as string,
      blockchainAnchorHash: row.blockchain_anchor_hash as string,
      status: row.status as ProductCode["status"],
      verificationCount: row.verification_count as number,
      firstVerifiedAt: row.first_verified_at ? (row.first_verified_at as Date).toISOString() : undefined,
      lastVerifiedAt: row.last_verified_at ? (row.last_verified_at as Date).toISOString() : undefined,
      verificationHistory: (row.verification_history as any[]) || [],
    })),
  }
}

export async function listAllBatches(): Promise<
  Array<{
    id: string
    productName: string
    distributor: string
    createdAt: string
    totalCodes: number
    verifiedCount: number
  }>
> {
  const rows = await sql`
    SELECT 
      pb.id,
      pb.product_name,
      pb.distributor,
      pb.created_at,
      COUNT(pc.id) as total_codes,
      COUNT(CASE WHEN pc.status != 'UNUSED' THEN 1 END) as verified_count
    FROM product_batches pb
    LEFT JOIN product_codes pc ON pb.id = pc.batch_id
    GROUP BY pb.id, pb.product_name, pb.distributor, pb.created_at
    ORDER BY pb.created_at DESC
  `

  return rows.map((row) => ({
    id: row.id as string,
    productName: row.product_name as string,
    distributor: row.distributor as string,
    createdAt: (row.created_at as Date).toISOString(),
    totalCodes: Number(row.total_codes),
    verifiedCount: Number(row.verified_count),
  }))
}

export async function createBatch(batch: ProductBatch): Promise<void> {
  await sql`
    INSERT INTO product_batches (id, product_name, distributor, created_at)
    VALUES (${batch.id}, ${batch.productName}, ${batch.distributor}, ${batch.createdAt})
  `

  // Batch insert codes for better performance
  if (batch.codes.length > 0) {
    // Insert codes one by one or in smaller batches to avoid SQL syntax issues
    for (const code of batch.codes) {
      await sql`
        INSERT INTO product_codes (
          id, batch_id, label_hash, verification_hash, blockchain_anchor_hash,
          status, verification_count, verification_history
        )
        VALUES (
          ${code.id},
          ${batch.id},
          ${code.labelHash},
          ${code.verificationHash},
          ${code.blockchainAnchorHash},
          ${code.status},
          ${code.verificationCount},
          ${JSON.stringify(code.verificationHistory)}::jsonb
        )
      `
    }
  }
}

export async function deleteBatch(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM product_batches
    WHERE id = ${id}
  `

  return result.count > 0
}

export async function findCodeByVerificationHash(hash: string): Promise<{
  batch: ProductBatch
  code: ProductCode
} | null> {
  const rows = await sql`
    SELECT 
      pc.id as code_id,
      pc.label_hash,
      pc.verification_hash,
      pc.blockchain_anchor_hash,
      pc.status,
      pc.verification_count,
      pc.first_verified_at,
      pc.last_verified_at,
      pc.verification_history,
      pb.id as batch_id,
      pb.product_name,
      pb.distributor,
      pb.created_at
    FROM product_codes pc
    JOIN product_batches pb ON pc.batch_id = pb.id
    WHERE pc.verification_hash = ${hash}
    LIMIT 1
  `

  if (rows.length === 0) {
    return null
  }

  const row = rows[0]

  return {
    batch: {
      id: row.batch_id as string,
      productName: row.product_name as string,
      distributor: row.distributor as string,
      createdAt: (row.created_at as Date).toISOString(),
      codes: [], // Not needed for verification lookup
    },
    code: {
      id: row.code_id as string,
      labelHash: row.label_hash as string,
      verificationHash: row.verification_hash as string,
      blockchainAnchorHash: row.blockchain_anchor_hash as string,
      status: row.status as ProductCode["status"],
      verificationCount: row.verification_count as number,
      firstVerifiedAt: row.first_verified_at ? (row.first_verified_at as Date).toISOString() : undefined,
      lastVerifiedAt: row.last_verified_at ? (row.last_verified_at as Date).toISOString() : undefined,
      verificationHistory: (row.verification_history as VerificationHistoryEntry[]) || [],
    },
  }
}

export async function updateCodeVerification(
  codeId: string,
  update: {
    status: ProductCode["status"]
    verificationCount: number
    firstVerifiedAt?: string
    lastVerifiedAt: string
    verificationHistory: VerificationHistoryEntry[]
  },
): Promise<void> {
  await sql`
    UPDATE product_codes
    SET 
      status = ${update.status},
      verification_count = ${update.verificationCount},
      first_verified_at = ${update.firstVerifiedAt || null},
      last_verified_at = ${update.lastVerifiedAt},
      verification_history = ${JSON.stringify(update.verificationHistory)}::jsonb
    WHERE id = ${codeId}
  `
}

export async function getNextBatchCounter(): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 6) AS INTEGER)), 0) as max_counter
    FROM product_batches
    WHERE id LIKE 'PROD-%'
  `

  return (rows[0]?.max_counter as number) || 0
}

export async function checkLabelHashExists(labelHash: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM product_codes WHERE label_hash = ${labelHash} LIMIT 1
  `

  return rows.length > 0
}

import { sql } from "./neon-client"
import type { BlockchainBlock, BlockchainEvent } from "@/lib/services/blockchain-service"

export async function getLatestBlock(): Promise<BlockchainBlock | null> {
  const rows = await sql`
    SELECT index, hash, previous_hash, merkle_root, timestamp, date, nonce, events
    FROM blockchain_blocks
    ORDER BY index DESC
    LIMIT 1
  `

  if (rows.length === 0) {
    return null
  }

  const row = rows[0]
  return {
    index: row.index as number,
    hash: row.hash as string,
    previousHash: row.previous_hash as string,
    merkleRoot: row.merkle_root as string,
    timestamp: (row.timestamp as Date).toISOString(),
    date: row.date as string,
    nonce: row.nonce as number,
    events: (row.events as BlockchainEvent[]) || [],
  }
}

export async function getAllBlocks(): Promise<BlockchainBlock[]> {
  const rows = await sql`
    SELECT index, hash, previous_hash, merkle_root, timestamp, date, nonce, events
    FROM blockchain_blocks
    ORDER BY index ASC
  `

  return rows.map((row) => ({
    index: row.index as number,
    hash: row.hash as string,
    previousHash: row.previous_hash as string,
    merkleRoot: row.merkle_root as string,
    timestamp: (row.timestamp as Date).toISOString(),
    date: row.date as string,
    nonce: row.nonce as number,
    events: (row.events as BlockchainEvent[]) || [],
  }))
}

export async function insertBlock(block: BlockchainBlock): Promise<void> {
  await sql`
    INSERT INTO blockchain_blocks (
      index, hash, previous_hash, merkle_root, timestamp, date, nonce, events
    )
    VALUES (
      ${block.index},
      ${block.hash},
      ${block.previousHash},
      ${block.merkleRoot},
      ${block.timestamp},
      ${block.date},
      ${block.nonce},
      ${JSON.stringify(block.events)}::jsonb
    )
  `
}

export async function getPendingAnchors(date: string): Promise<BlockchainEvent[]> {
  const rows = await sql`
    SELECT events
    FROM pending_anchors
    WHERE date = ${date}
  `

  if (rows.length === 0) {
    return []
  }

  return (rows[0].events as BlockchainEvent[]) || []
}

export async function getAllPendingAnchors(): Promise<Record<string, BlockchainEvent[]>> {
  const rows = await sql`
    SELECT date, events
    FROM pending_anchors
    ORDER BY date ASC
  `

  const result: Record<string, BlockchainEvent[]> = {}
  for (const row of rows) {
    result[row.date as string] = (row.events as BlockchainEvent[]) || []
  }

  return result
}

export async function upsertPendingAnchors(date: string, events: BlockchainEvent[]): Promise<void> {
  await sql`
    INSERT INTO pending_anchors (date, events)
    VALUES (${date}, ${JSON.stringify(events)}::jsonb)
    ON CONFLICT (date)
    DO UPDATE SET events = ${JSON.stringify(events)}::jsonb
  `
}

export async function deletePendingAnchors(date: string): Promise<void> {
  await sql`
    DELETE FROM pending_anchors
    WHERE date = ${date}
  `
}

export async function findEventByCodeId(codeId: string): Promise<{
  event: BlockchainEvent
  block: BlockchainBlock
} | null> {
  const rows = await sql`
    SELECT index, hash, previous_hash, merkle_root, timestamp, date, nonce, events
    FROM blockchain_blocks
    WHERE events::jsonb @> ${JSON.stringify([{ codeId }])}::jsonb
    ORDER BY index DESC
    LIMIT 1
  `

  if (rows.length === 0) {
    return null
  }

  const row = rows[0]
  const block: BlockchainBlock = {
    index: row.index as number,
    hash: row.hash as string,
    previousHash: row.previous_hash as string,
    merkleRoot: row.merkle_root as string,
    timestamp: (row.timestamp as Date).toISOString(),
    date: row.date as string,
    nonce: row.nonce as number,
    events: (row.events as BlockchainEvent[]) || [],
  }

  const event = block.events.find((e) => e.codeId === codeId)
  if (!event) {
    return null
  }

  return { event, block }
}

export async function countNonGenesisBlocks(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) as count
    FROM blockchain_blocks
    WHERE index > 0
  `

  return Number(rows[0]?.count || 0)
}

export async function getTotalActivations(): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(jsonb_array_length(events)), 0) as total
    FROM blockchain_blocks
    WHERE index > 0
  `

  return Number(rows[0]?.total || 0)
}

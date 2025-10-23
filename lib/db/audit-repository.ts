import { sql } from "./neon-client"
import type { AuditLogEntry } from "@/lib/services/audit-service"

export async function insertAuditLog(entry: Omit<AuditLogEntry, "id">): Promise<void> {
  await sql`
    INSERT INTO audit_logs (
      timestamp, code, status, ip_hash, product_id, product_name, distributor, code_id
    )
    VALUES (
      ${entry.timestamp},
      ${entry.code},
      ${entry.status},
      ${entry.ipHash},
      ${entry.productId || null},
      ${entry.productName || null},
      ${entry.distributor || null},
      ${entry.codeId || null}
    )
  `
}

export async function getRecentAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  const rows = await sql`
    SELECT 
      id, timestamp, code, status, ip_hash, product_id, product_name, distributor, code_id
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `

  return rows.map((row) => ({
    id: row.id as string,
    timestamp: (row.timestamp as Date).toISOString(),
    code: row.code as string,
    status: row.status as AuditLogEntry["status"],
    ipHash: row.ip_hash as string,
    productId: row.product_id as string | undefined,
    productName: row.product_name as string | undefined,
    distributor: row.distributor as string | undefined,
    codeId: row.code_id as string | undefined,
  }))
}

export async function getAuditLogCount(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) as count FROM audit_logs
  `

  return Number(rows[0]?.count || 0)
}

import { AUDIT_LOG_LIMIT } from "@/lib/config"
import { insertAuditLog, getRecentAuditLogs } from "@/lib/db/audit-repository"

export type AuditStatus = "TERVERIFIKASI" | "PERNAH_TERVERIFIKASI" | "TIDAK_TERVERIFIKASI"

export interface AuditLogEntry {
  id: string
  timestamp: string
  code: string
  status: AuditStatus
  ipHash: string
  productId?: string
  productName?: string
  distributor?: string
  codeId?: string
}

export async function appendAuditLog(entry: AuditLogEntry) {
  await insertAuditLog(entry)
}

export async function listAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  const effectiveLimit = Math.min(limit, AUDIT_LOG_LIMIT)
  return await getRecentAuditLogs(effectiveLimit)
}

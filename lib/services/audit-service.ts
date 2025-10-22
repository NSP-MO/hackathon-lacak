import { AUDIT_LOG_LIMIT } from "@/lib/config"
import { mutateStore, readStore } from "@/lib/utils/file-storage"

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

interface AuditStore {
  logs: AuditLogEntry[]
}

const STORE_FILE = "audit-log.json"

const defaultStore: AuditStore = {
  logs: [],
}

export async function appendAuditLog(entry: AuditLogEntry) {
  await mutateStore(STORE_FILE, defaultStore, (state) => {
    state.logs.push(entry)

    if (state.logs.length > AUDIT_LOG_LIMIT) {
      state.logs = state.logs.slice(state.logs.length - AUDIT_LOG_LIMIT)
    }

    return state
  })
}

export async function listAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  const store = await readStore(STORE_FILE, defaultStore)
  const recent = store.logs.slice(-limit)
  return recent.reverse()
}

"use client"

import { Card } from "@/components/ui/card"

type AuditStatus = "TERVERIFIKASI" | "PERNAH_TERVERIFIKASI" | "TIDAK_TERVERIFIKASI"

interface AuditLog {
  id: string
  productId?: string
  productName?: string
  distributor?: string
  status: AuditStatus
  timestamp: string
  ipHash: string
  code: string
  codeId?: string
}

interface AdminAuditLogProps {
  logs: AuditLog[]
  loading: boolean
}

const statusLabel: Record<AuditStatus, string> = {
  TERVERIFIKASI: "Terverifikasi",
  PERNAH_TERVERIFIKASI: "Pernah Terverifikasi",
  TIDAK_TERVERIFIKASI: "Tidak Terverifikasi",
}

const statusBadge: Record<AuditStatus, string> = {
  TERVERIFIKASI: "bg-green-500/10 text-green-400 border-green-500/30",
  PERNAH_TERVERIFIKASI: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  TIDAK_TERVERIFIKASI: "bg-red-500/10 text-red-400 border-red-500/30",
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
}

export default function AdminAuditLog({ logs, loading }: AdminAuditLogProps) {
  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700 p-8 text-center">
        <p className="text-slate-400">Memuat log verifikasi...</p>
      </Card>
    )
  }

  if (logs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-700 p-8 text-center">
        <p className="text-slate-400">Belum ada aktivitas verifikasi</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Produk</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Kode</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Waktu</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">IP Hash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                <td className="py-3 px-4 text-white">
                  <div className="font-medium">{log.productName ?? "Tidak terdaftar"}</div>
                  <div className="text-xs text-slate-400">
                    {log.productId ?? "-"}
                    {log.distributor ? ` · ${log.distributor}` : ""}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-mono text-xs text-slate-200">{log.code}</div>
                  <div className="text-xs text-slate-400">{log.codeId ?? "-"}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge[log.status]}`}>
                    {statusLabel[log.status]}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">{formatDateTime(log.timestamp)}</td>
                <td className="py-3 px-4 text-slate-400 font-mono text-xs">{log.ipHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

"use client"

import { Card } from "@/components/ui/card"

interface AuditLog {
  id: string
  productId: string
  productName: string
  status: "verified" | "already_verified" | "not_found"
  timestamp: string
  ipHash: string
}

interface AdminAuditLogProps {
  logs: AuditLog[]
  loading: boolean
}

export default function AdminAuditLog({ logs, loading }: AdminAuditLogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-500/10 text-green-400 border-green-500/30"
      case "already_verified":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
      case "not_found":
        return "bg-red-500/10 text-red-400 border-red-500/30"
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30"
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700 p-8 text-center">
        <p className="text-slate-400">Loading audit logs...</p>
      </Card>
    )
  }

  if (logs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-700 p-8 text-center">
        <p className="text-slate-400">No audit logs yet</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Product</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Timestamp</th>
              <th className="text-left py-3 px-4 text-slate-400 font-medium">IP Hash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                <td className="py-3 px-4 text-white">{log.productName}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                    {log.status === "verified" && "Verified"}
                    {log.status === "already_verified" && "Already Used"}
                    {log.status === "not_found" && "Not Found"}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">{log.timestamp}</td>
                <td className="py-3 px-4 text-slate-400 font-mono text-xs">{log.ipHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

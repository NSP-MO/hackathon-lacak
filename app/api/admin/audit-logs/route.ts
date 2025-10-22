import { NextResponse } from "next/server"

import { listAuditLogs } from "@/lib/services/audit-service"

export async function GET() {
  try {
    const logs = await listAuditLogs()
    return NextResponse.json(logs)
  } catch (error) {
    console.error("[v0] Error fetching audit logs:", error)
    return NextResponse.json(
      { message: "Gagal memuat log audit", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

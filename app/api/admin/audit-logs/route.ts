import { NextResponse } from "next/server"

import { listAuditLogs } from "@/lib/services/audit-service"

export async function GET() {
  const logs = await listAuditLogs()
  return NextResponse.json(logs)
}

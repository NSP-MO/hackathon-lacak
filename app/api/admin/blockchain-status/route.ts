import { NextResponse } from "next/server"

import { getBlockchainStatus } from "@/lib/services/blockchain-service"

export async function GET() {
  const status = await getBlockchainStatus()
  return NextResponse.json(status)
}

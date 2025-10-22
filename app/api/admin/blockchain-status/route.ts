import { NextResponse } from "next/server"

import { getBlockchainStatus } from "@/lib/services/blockchain-service"

export async function GET() {
  try {
    const status = await getBlockchainStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error("[v0] Error fetching blockchain status:", error)
    return NextResponse.json(
      { message: "Gagal memuat status blockchain", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

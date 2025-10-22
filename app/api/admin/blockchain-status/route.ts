import { NextResponse } from "next/server"

import { getBlockchainStatus } from "@/lib/services/blockchain-service"

export async function GET() {
  try {
    console.log("[v0] Fetching blockchain status...")
    const status = await getBlockchainStatus()
    console.log("[v0] Blockchain status fetched successfully:", status)
    return NextResponse.json(status)
  } catch (error) {
    console.error("[v0] Error fetching blockchain status:", error)
    const defaultStatus = {
      lastAnchorDate: "Belum ada anchor",
      totalActivations: 0,
      latestMerkleRoot: "-",
      network: "Ethereum Sepolia Testnet",
      contractAddress: "0x51E2620A7ab1411f4f626fb68d98E68f58c31167",
      pendingToday: 0,
    }
    console.log("[v0] Returning default blockchain status due to error")
    return NextResponse.json(defaultStatus)
  }
}

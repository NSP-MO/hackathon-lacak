import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  // Generate sample Merkle root
  const merkleRoot = crypto.randomBytes(32).toString("hex").toUpperCase()

  return NextResponse.json({
    lastAnchorDate: new Date().toLocaleDateString("id-ID"),
    totalActivations: 1247,
    latestMerkleRoot: merkleRoot,
    network: "Polygon Mumbai (Testnet)",
    contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0e",
    status: "active",
  })
}

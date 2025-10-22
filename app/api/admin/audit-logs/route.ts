import { NextResponse } from "next/server"

// In-memory audit logs
const auditLogs: any[] = []

export async function GET() {
  // Return sample audit logs
  const sampleLogs = [
    {
      id: "1",
      productId: "PROD-0001",
      productName: "Premium Skincare Serum",
      status: "verified",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ipHash: "a1b2c3d4e5f6g7h8",
    },
    {
      id: "2",
      productId: "PROD-0002",
      productName: "Organic Face Mask",
      status: "already_verified",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ipHash: "b2c3d4e5f6g7h8i9",
    },
    {
      id: "3",
      productId: "PROD-0003",
      productName: "Anti-Aging Cream",
      status: "verified",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      ipHash: "c3d4e5f6g7h8i9j0",
    },
  ]

  return NextResponse.json(sampleLogs)
}

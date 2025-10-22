import { type NextRequest, NextResponse } from "next/server"

import { verifyProductCode } from "@/lib/services/verification-service"

function extractIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const [ip] = forwarded.split(",").map((part) => part.trim())
    if (ip) {
      return ip
    }
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return request.ip ?? null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = body?.code

    if (typeof code !== "string") {
      return NextResponse.json(
        { message: "Kode harus berupa string 16 digit heksadesimal." },
        { status: 400 },
      )
    }

    const result = await verifyProductCode(code, extractIp(request))
    const statusCode = result.status === "TIDAK_TERVERIFIKASI" ? 404 : 200

    return NextResponse.json(result, { status: statusCode })
  } catch (error: any) {
    console.error("Verification error:", error)

    if (error instanceof Error && error.message.includes("16 digit heksadesimal")) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server verifikasi." },
      { status: 500 },
    )
  }
}

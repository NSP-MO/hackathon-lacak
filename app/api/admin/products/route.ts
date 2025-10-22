import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// In-memory database
const adminProducts: Map<string, any> = new Map()
let productCounter = 0

export async function GET() {
  const products = Array.from(adminProducts.values()).map((p) => ({
    id: p.id,
    productName: p.productName,
    distributor: p.distributor,
    totalCodes: p.codes.length,
    verifiedCount: p.codes.filter((c: any) => c.spent).length,
    createdAt: p.createdAt,
  }))

  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  try {
    const { productName, distributor, quantity } = await request.json()

    const productId = `PROD-${String(++productCounter).padStart(4, "0")}`
    const codes = []

    // Generate unique codes
    for (let i = 0; i < quantity; i++) {
      const code = crypto.randomBytes(8).toString("hex").toUpperCase()
      codes.push({
        code,
        hash: crypto.createHash("sha256").update(code).digest("hex"),
        spent: false,
      })
    }

    adminProducts.set(productId, {
      id: productId,
      productName,
      distributor,
      codes,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      id: productId,
      productName,
      distributor,
      totalCodes: quantity,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 })
  }
}

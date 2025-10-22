import { type NextRequest, NextResponse } from "next/server"

// Mock database of valid product codes
// In production, this would query your actual database
const validCodes = new Map<string, { productId: string; spent: boolean; timestamp: string }>([
  ["A1B2C3D4E5F6G7H8", { productId: "PROD-001", spent: false, timestamp: new Date().toISOString() }],
  ["X9Y8Z7W6V5U4T3S2", { productId: "PROD-002", spent: false, timestamp: new Date().toISOString() }],
  ["M1N2O3P4Q5R6S7T8", { productId: "PROD-003", spent: false, timestamp: new Date().toISOString() }],
])

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== "string") {
      return NextResponse.json({ message: "Invalid code format" }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase()

    // Check if code exists in database
    const productData = validCodes.get(normalizedCode)

    if (!productData) {
      return NextResponse.json({ message: "Product code not found in our database" }, { status: 404 })
    }

    // Check if code has already been used
    if (productData.spent) {
      return NextResponse.json(
        { message: "This code has already been activated. Product may be counterfeit." },
        { status: 400 },
      )
    }

    // Mark code as spent
    productData.spent = true
    productData.timestamp = new Date().toISOString()

    return NextResponse.json({
      status: "authentic",
      productId: productData.productId,
      message: "Product verified successfully",
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ message: "An error occurred during verification" }, { status: 500 })
  }
}

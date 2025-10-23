import { type NextRequest, NextResponse } from "next/server"

import { createProductBatch, listProductSummaries } from "@/lib/services/product-service"

export async function GET() {
  try {
    console.log("[v0] GET /api/admin/products - Fetching product list...")
    const products = await listProductSummaries()
    console.log("[v0] Successfully fetched", products.length, "products")
    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        message: "Gagal memuat daftar produk",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, distributor } = body ?? {}
    const quantity = Number(body?.quantity ?? 0)

    console.log("[v0] POST /api/admin/products - Request body:", { productName, distributor, quantity })

    if (!productName || typeof productName !== "string") {
      return NextResponse.json({ message: "Nama produk wajib diisi" }, { status: 400 })
    }

    if (!distributor || typeof distributor !== "string") {
      return NextResponse.json({ message: "Distributor wajib diisi" }, { status: 400 })
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 10000) {
      return NextResponse.json({ message: "Jumlah kode harus berupa bilangan bulat antara 1-10000" }, { status: 400 })
    }

    console.log("[v0] Creating product batch...")
    const batch = await createProductBatch({ productName, distributor, quantity })
    console.log("[v0] Product batch created successfully:", batch.id)

    return NextResponse.json({
      id: batch.id,
      productName: batch.productName,
      distributor: batch.distributor,
      createdAt: batch.createdAt,
      totalCodes: batch.codes.length,
      verifiedCount: batch.codes.filter((code) => code.status !== "UNUSED").length,
      codes: batch.codes.map((code) => ({
        codeId: code.id,
        labelHash: code.labelHash,
        blockchainAnchorHash: code.blockchainAnchorHash,
        verificationHash: code.verificationHash,
      })),
    })
  } catch (error) {
    console.error("[v0] Error creating product:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        message: "Gagal membuat batch produk",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

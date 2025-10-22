import { type NextRequest, NextResponse } from "next/server"

import {
  createProductBatch,
  listProductSummaries,
} from "@/lib/services/product-service"

export async function GET() {
  const products = await listProductSummaries()
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, distributor } = body ?? {}
    const quantity = Number(body?.quantity ?? 0)

    if (!productName || typeof productName !== "string") {
      return NextResponse.json({ message: "Nama produk wajib diisi" }, { status: 400 })
    }

    if (!distributor || typeof distributor !== "string") {
      return NextResponse.json({ message: "Distributor wajib diisi" }, { status: 400 })
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 10000) {
      return NextResponse.json(
        { message: "Jumlah kode harus berupa bilangan bulat antara 1-10000" },
        { status: 400 },
      )
    }

    const batch = await createProductBatch({ productName, distributor, quantity })

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
    console.error("Error creating product:", error)
    return NextResponse.json({ message: "Gagal membuat batch produk" }, { status: 500 })
  }
}

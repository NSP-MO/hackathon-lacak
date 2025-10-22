import { type NextRequest, NextResponse } from "next/server"

import {
  deleteProductBatch,
  getProductBatchById,
} from "@/lib/services/product-service"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const batch = await getProductBatchById(params.id)

    if (!batch) {
      return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 })
    }

    const verifiedCount = batch.codes.filter((code) => code.status !== "UNUSED").length

    return NextResponse.json({
      id: batch.id,
      productName: batch.productName,
      distributor: batch.distributor,
      createdAt: batch.createdAt,
      totalCodes: batch.codes.length,
      verifiedCount,
      codes: batch.codes.map((code) => ({
        codeId: code.id,
        code: code.labelHash,
        blockchainAnchorHash: code.blockchainAnchorHash,
        status: code.status,
        verificationCount: code.verificationCount,
        firstVerifiedAt: code.firstVerifiedAt ?? null,
        lastVerifiedAt: code.lastVerifiedAt ?? null,
        history: code.verificationHistory.map((entry) => ({
          timestamp: entry.timestamp,
          status: entry.status,
          ipHash: entry.ipHash,
        })),
      })),
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ message: "Gagal memuat detail produk" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await deleteProductBatch(params.id)

    if (!deleted) {
      return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ message: "Gagal menghapus produk" }, { status: 500 })
  }
}

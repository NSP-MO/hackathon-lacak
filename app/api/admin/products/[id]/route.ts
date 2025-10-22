import { type NextRequest, NextResponse } from "next/server"

import { deleteProductBatch } from "@/lib/services/product-service"

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

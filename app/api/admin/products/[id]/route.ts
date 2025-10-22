import { type NextRequest, NextResponse } from "next/server"

const adminProducts: Map<string, any> = new Map()

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    adminProducts.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete product" }, { status: 500 })
  }
}

"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Eye } from "lucide-react"

interface Product {
  id: string
  productName: string
  distributor: string
  totalCodes: number
  verifiedCount: number
  createdAt: string
}

interface AdminProductListProps {
  products: Product[]
  searchQuery: string
  onDelete: (id: string) => void
  onView: (id: string) => void
  loading: boolean
  selectedProductId?: string | null
  detailLoadingProductId?: string | null
}

export default function AdminProductList({
  products,
  searchQuery,
  onDelete,
  onView,
  loading,
  selectedProductId,
  detailLoadingProductId,
}: AdminProductListProps) {
  const filteredProducts = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.distributor.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700 p-8 text-center">
        <p className="text-slate-400">Loading products...</p>
      </Card>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-700 p-8 text-center">
        <p className="text-slate-400">No products found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {filteredProducts.map((product) => (
        <Card
          key={product.id}
          className={`bg-slate-900 p-6 border ${
            selectedProductId === product.id ? "border-orange-500/60 shadow-lg shadow-orange-500/20" : "border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{product.productName}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Distributor</p>
                  <p className="text-white font-medium">{product.distributor}</p>
                </div>
                <div>
                  <p className="text-slate-400">Total Codes</p>
                  <p className="text-white font-medium">{product.totalCodes}</p>
                </div>
                <div>
                  <p className="text-slate-400">Verified</p>
                  <p className="text-green-500 font-medium">
                    {product.verifiedCount} (
                    {product.totalCodes === 0
                      ? 0
                      : Math.round((product.verifiedCount / product.totalCodes) * 100)}
                    %)
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(product.id)}
                disabled={detailLoadingProductId === product.id}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
              >
                <Eye className="w-4 h-4" />
                <span className="sr-only">Lihat detail kode</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(product.id)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Hapus produk</span>
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

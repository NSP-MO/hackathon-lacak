"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"

interface AdminProductFormProps {
  onProductAdded: (productId: string) => void | Promise<void>
}

export default function AdminProductForm({ onProductAdded }: AdminProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    productName: "",
    distributor: "",
    quantity: "1",
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      console.log("[v0] Submitting product form:", formData)
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: Number.parseInt(formData.quantity),
        }),
      })

      let payload: any = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      console.log("[v0] API response:", { status: response.status, payload })

      if (!response.ok) {
        throw new Error(payload?.message ?? "Gagal membuat batch produk")
      }

      setSuccessMessage(`Batch produk berhasil dibuat dengan ${payload?.totalCodes || 0} kode`)
      setFormData({ productName: "", distributor: "", quantity: "1" })

      if (payload?.id) {
        await onProductAdded(payload.id as string)
      } else {
        await onProductAdded("")
      }
    } catch (error) {
      console.error("[v0] Error adding product:", error)
      const message = error instanceof Error ? error.message : "Gagal membuat batch produk"
      setErrorMessage(message)
    }
    setLoading(false)
  }

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <h2 className="text-lg font-bold text-white mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Product Name</label>
          <input
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="e.g., Premium Skincare Serum"
            required
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Distributor</label>
          <input
            type="text"
            value={formData.distributor}
            onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
            placeholder="e.g., PT Distributor Indonesia"
            required
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            min="1"
            max="10000"
            required
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
        </div>

        {successMessage && (
          <div className="text-sm text-green-200 bg-green-500/10 border border-green-500/40 rounded-md px-4 py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/40 rounded-md px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Product Batch"
          )}
        </Button>
      </form>
    </Card>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AdminProductFormProps {
  onProductAdded: () => void
}

export default function AdminProductForm({ onProductAdded }: AdminProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    productName: "",
    distributor: "",
    quantity: "1",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: Number.parseInt(formData.quantity),
        }),
      })

      if (response.ok) {
        setFormData({ productName: "", distributor: "", quantity: "1" })
        onProductAdded()
      }
    } catch (error) {
      console.error("Error adding product:", error)
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
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
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
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
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
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

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

"use client"

import { useState, useEffect } from "react"
import { Shield, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import AdminProductForm from "@/components/admin-product-form"
import AdminProductList from "@/components/admin-product-list"
import AdminAuditLog from "@/components/admin-audit-log"

type AdminTab = "products" | "audit" | "blockchain"

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("products")
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [blockchainData, setBlockchainData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === "products") {
        const response = await fetch("/api/admin/products")
        const data = await response.json()
        setProducts(data)
      } else if (tab === "audit") {
        const response = await fetch("/api/admin/audit-logs")
        const data = await response.json()
        setAuditLogs(data)
      } else if (tab === "blockchain") {
        const response = await fetch("/api/admin/blockchain-status")
        const data = await response.json()
        setBlockchainData(data)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
    setLoading(false)
  }

  const handleProductAdded = () => {
    setShowForm(false)
    loadData()
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
      loadData()
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <Shield className="w-6 h-6 text-orange-500" />
            <span className="font-bold text-white">LACAK Admin</span>
          </Link>
          <Link href="/verify">
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
              Consumer Portal
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setTab("products")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === "products"
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setTab("audit")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === "audit"
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setTab("blockchain")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === "blockchain"
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Blockchain Status
          </button>
        </div>

        {/* Products Tab */}
        {tab === "products" && (
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <Button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {showForm && <AdminProductForm onProductAdded={handleProductAdded} />}

            <AdminProductList
              products={products}
              searchQuery={searchQuery}
              onDelete={handleDeleteProduct}
              loading={loading}
            />
          </div>
        )}

        {/* Audit Logs Tab */}
        {tab === "audit" && <AdminAuditLog logs={auditLogs} loading={loading} />}

        {/* Blockchain Status Tab */}
        {tab === "blockchain" && (
          <div className="space-y-6">
            {blockchainData && (
              <>
                <Card className="bg-slate-900 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Daily Merkle Root Anchoring</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Last Anchor Date</p>
                      <p className="text-2xl font-bold text-orange-500">{blockchainData.lastAnchorDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Total Activations Anchored</p>
                      <p className="text-2xl font-bold text-green-500">{blockchainData.totalActivations}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Pending (Today)</p>
                      <p className="text-2xl font-bold text-amber-500">{blockchainData.pendingToday ?? 0}</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-900 border-slate-700 p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Latest Merkle Root</h2>
                  <div className="bg-slate-800 p-4 rounded-lg break-all font-mono text-xs text-slate-300">
                    {blockchainData.latestMerkleRoot}
                  </div>
                </Card>

                <Card className="bg-slate-900 border-slate-700 p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Blockchain Network</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Network:</span>
                      <span className="text-white font-medium">{blockchainData.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Smart Contract:</span>
                      <span className="text-white font-mono text-sm">{blockchainData.contractAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-green-500 font-medium">Active</span>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

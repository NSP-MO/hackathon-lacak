"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Copy, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ProductCode {
  codeId: string
  code: string
  blockchainAnchorHash: string
  status?: string
}

interface BatchDetail {
  id: string
  productName: string
  distributor: string
  createdAt: string
  totalCodes: number
  verifiedCount: number
  codes: ProductCode[]
}

export default function BatchDetailPage() {
  const params = useParams()
  const batchId = params.id as string
  const [batch, setBatch] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const fetchBatchDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/admin/products/${batchId}`)

        if (!response.ok) {
          throw new Error("Gagal memuat detail batch")
        }

        const data = await response.json()
        setBatch(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
        console.error("[v0] Error fetching batch detail:", err)
      } finally {
        setLoading(false)
      }
    }

    if (batchId) {
      fetchBatchDetail()
    }
  }, [batchId])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleDownloadCodes = () => {
    if (!batch) return

    const csvContent = [
      ["Kode Produk", "ID Unit", "Status", "Tanggal Dibuat"],
      ...batch.codes.map((code) => [code.code, code.codeId, code.status || "UNUSED", batch.createdAt]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${batch.id}-codes.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin">
            <Button className="mb-6 bg-slate-700 hover:bg-slate-600 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Admin
            </Button>
          </Link>
          <Card className="bg-red-500/10 border-red-500/40 p-6">
            <p className="text-red-300">{error || "Batch tidak ditemukan"}</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin">
          <Button className="mb-6 bg-slate-700 hover:bg-slate-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Admin
          </Button>
        </Link>

        <Card className="bg-slate-900 border-slate-700 p-8 mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">{batch.productName}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Batch ID</p>
                <p className="text-white font-mono">{batch.id}</p>
              </div>
              <div>
                <p className="text-slate-400">Distributor</p>
                <p className="text-white">{batch.distributor}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Kode</p>
                <p className="text-white font-semibold">{batch.totalCodes}</p>
              </div>
              <div>
                <p className="text-slate-400">Terverifikasi</p>
                <p className="text-green-400 font-semibold">
                  {batch.verifiedCount} ({Math.round((batch.verifiedCount / batch.totalCodes) * 100)}%)
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleDownloadCodes} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Daftar Kode Produk</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Kode Produk</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">ID Unit</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {batch.codes.map((code) => (
                  <tr key={code.codeId} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <code className="text-orange-400 font-mono font-semibold">{code.code}</code>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-slate-300 font-mono text-xs">{code.codeId}</code>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          code.status === "UNUSED"
                            ? "bg-slate-700 text-slate-300"
                            : code.status === "TERVERIFIKASI"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {code.status || "UNUSED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyCode(code.code)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedCode === code.code ? "Disalin!" : "Salin"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

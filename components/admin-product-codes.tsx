"use client"

import { useMemo, useState } from "react"
import { X, Hash, History, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export type VerificationStatus = "UNUSED" | "TERVERIFIKASI" | "PERNAH_TERVERIFIKASI"

export interface ProductCodeHistoryEntry {
  timestamp: string
  status: Exclude<VerificationStatus, "UNUSED">
  ipHash: string
}

export interface ProductCodeDetail {
  codeId: string
  code: string
  blockchainAnchorHash: string
  status: VerificationStatus
  verificationCount: number
  firstVerifiedAt?: string | null
  lastVerifiedAt?: string | null
  history?: ProductCodeHistoryEntry[]
}

export interface ProductDetail {
  id: string
  productName: string
  distributor: string
  createdAt: string
  totalCodes: number
  verifiedCount: number
  codes: ProductCodeDetail[]
}

interface AdminProductCodesProps {
  product: ProductDetail
  onClose: () => void
}

const statusLabel: Record<VerificationStatus, string> = {
  UNUSED: "Belum digunakan",
  TERVERIFIKASI: "Terverifikasi",
  PERNAH_TERVERIFIKASI: "Pernah Terverifikasi",
}

const statusBadge: Record<VerificationStatus, string> = {
  UNUSED: "bg-slate-700/50 text-slate-200 border-slate-500/40",
  TERVERIFIKASI: "bg-green-500/10 text-green-400 border-green-500/30",
  PERNAH_TERVERIFIKASI: "bg-amber-500/10 text-amber-400 border-amber-500/30",
}

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("id-ID", { dateStyle: "long" })
}

export default function AdminProductCodes({ product, onClose }: AdminProductCodesProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const verificationRate = useMemo(() => {
    if (product.totalCodes === 0) return 0
    return Math.round((product.verifiedCount / product.totalCodes) * 100)
  }, [product.totalCodes, product.verifiedCount])

  const handleCopy = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCodeId(codeId)
      setTimeout(() => setCopiedCodeId(null), 2000)
    } catch (error) {
      console.error("Failed to copy code", error)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-700 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">Batch Produk {product.id}</h2>
          </div>
          <div className="text-sm text-slate-300">
            <p className="text-base text-white font-medium">{product.productName}</p>
            <p>Distributor: <span className="text-white">{product.distributor}</span></p>
            <p>Digenerasi pada: <span className="text-white">{formatDate(product.createdAt)}</span></p>
          </div>
        </div>
        <div className="flex gap-2 items-center md:self-start">
          <div className="text-right text-sm text-slate-300">
            <p>Total Kode: <span className="text-white font-medium">{product.totalCodes}</span></p>
            <p>
              Terverifikasi: <span className="text-green-400 font-medium">{product.verifiedCount}</span>
              <span className="text-slate-500"> ({verificationRate}%)</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Tutup detail produk"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left py-3 px-4 font-medium">Kode 16 Digit</th>
              <th className="text-left py-3 px-4 font-medium">ID Produk</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Total Verifikasi</th>
              <th className="text-left py-3 px-4 font-medium">Hash Anchor</th>
              <th className="text-left py-3 px-4 font-medium">Terakhir Diverifikasi</th>
            </tr>
          </thead>
          <tbody>
            {product.codes.map((code) => (
              <tr key={code.codeId} className="border-b border-slate-800/80 hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-white">{code.code}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleCopy(code.code, code.codeId)}
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                      aria-label={`Salin kode ${code.codeId}`}
                    >
                      {copiedCodeId === code.codeId ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-300 font-mono">{code.codeId}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full border text-xs font-medium ${statusBadge[code.status]}`}>
                    {statusLabel[code.status]}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-200">{code.verificationCount}</td>
                <td className="py-3 px-4">
                  <div className="font-mono text-[11px] leading-5 text-slate-300 break-all max-w-xs">
                    {code.blockchainAnchorHash}
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-200">
                  <div>{formatDateTime(code.lastVerifiedAt)}</div>
                  {code.firstVerifiedAt && code.lastVerifiedAt !== code.firstVerifiedAt && (
                    <div className="text-xs text-slate-500">
                      Pertama: {formatDateTime(code.firstVerifiedAt)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {product.codes.some((code) => code.history && code.history.length > 0) && (
        <div className="bg-slate-800/40 border border-slate-700/80 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <History className="w-4 h-4 text-sky-400" />
            <span>Riwayat Verifikasi Per Kode</span>
          </div>
          <div className="space-y-2">
            {product.codes
              .filter((code) => code.history && code.history.length > 0)
              .map((code) => (
                <div key={`${code.codeId}-history`} className="space-y-1">
                  <p className="text-xs text-slate-400">
                    {code.codeId} · {code.code}
                  </p>
                  <ul className="text-sm text-slate-200 space-y-1">
                    {code.history!.map((entry) => (
                      <li key={`${code.codeId}-${entry.timestamp}`} className="flex items-center justify-between">
                        <span>{formatDateTime(entry.timestamp)}</span>
                        <span className="text-xs font-medium text-slate-300">
                          {statusLabel[entry.status]}
                          <span className="text-slate-500"> · {entry.ipHash}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  )
}

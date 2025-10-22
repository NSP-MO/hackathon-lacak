"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Factory,
  Hash,
  History,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const HEX_PATTERN = /^[0-9A-F]{16}$/

type VerificationStatus = "TERVERIFIKASI" | "PERNAH_TERVERIFIKASI" | "TIDAK_TERVERIFIKASI"

interface VerificationHistoryEntry {
  timestamp: string
  status: VerificationStatus
}

interface BlockchainProof {
  anchorHash: string
  anchorDate: string
  status: VerificationStatus
  anchored: boolean
  blockHash?: string
  blockIndex?: number
  blockTimestamp?: string
  merkleRoot?: string
  pendingCount?: number
}

interface VerificationData {
  status: VerificationStatus
  message: string
  code: string
  productId?: string
  productName?: string
  distributor?: string
  codeId?: string
  verificationCount?: number
  firstVerifiedAt?: string
  lastVerifiedAt?: string
  history?: VerificationHistoryEntry[]
  blockchainProof?: BlockchainProof | null
}

type VerificationState =
  | { kind: "success"; data: VerificationData }
  | { kind: "error"; message: string }

const statusMeta: Record<VerificationStatus, { label: string; accent: string; card: string; text: string; icon: JSX.Element }> = {
  TERVERIFIKASI: {
    label: "Terverifikasi",
    accent: "text-green-400",
    card: "bg-green-500/10 border-green-500/40",
    text: "text-green-300",
    icon: <CheckCircle className="w-8 h-8 text-green-400" />,
  },
  PERNAH_TERVERIFIKASI: {
    label: "Pernah Terverifikasi",
    accent: "text-amber-400",
    card: "bg-amber-500/10 border-amber-500/40",
    text: "text-amber-300",
    icon: <History className="w-8 h-8 text-amber-400" />,
  },
  TIDAK_TERVERIFIKASI: {
    label: "Tidak Terverifikasi",
    accent: "text-red-400",
    card: "bg-red-500/10 border-red-500/40",
    text: "text-red-300",
    icon: <AlertCircle className="w-8 h-8 text-red-400" />,
  },
}

function formatDateTime(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatDate(value?: string) {
  if (!value) return "-"
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return date.toLocaleDateString("id-ID", { dateStyle: "long" })
}

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationState | null>(null)

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!code.trim()) {
      setResult({ kind: "error", message: "Silakan masukkan kode produk." })
      return
    }

    if (!HEX_PATTERN.test(code.trim().toUpperCase())) {
      setResult({ kind: "error", message: "Kode harus 16 digit heksadesimal (0-9, A-F)." })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (response.ok || data?.status === "TIDAK_TERVERIFIKASI") {
        setResult({ kind: "success", data })

        if (data?.status === "TERVERIFIKASI") {
          setCode("")
        }
      } else {
        setResult({
          kind: "error",
          message: data?.message ?? "Terjadi kesalahan saat melakukan verifikasi.",
        })
      }
    } catch (error) {
      console.error("verify error", error)
      setResult({
        kind: "error",
        message: "Tidak dapat terhubung ke server verifikasi. Coba lagi beberapa saat.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Shield className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold text-white">LACAK</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/admin">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Admin Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Verifikasi Produk Anda</h1>
          <p className="text-xl text-slate-300">
            Masukkan kode 16 digit heksadesimal dari label LACAK untuk memastikan keaslian produk.
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-8 mb-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-200 mb-2">
                Kode Produk
              </label>
              <input
                id="code"
                type="text"
                placeholder="Contoh: A1B2C3D4E5F6A7B8"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                maxLength={16}
                autoComplete="off"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-2">Kode tertera pada label anti-pemalsuan atau NFC tag produk Anda.</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Verifikasi Produk"
              )}
            </Button>
          </form>
        </Card>

        {/* Result Display */}
        {result && result.kind === "error" && (
          <Card className="p-8 border-2 bg-red-500/10 border-red-500/40">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-300 mb-2">Gagal Memverifikasi</h3>
                <p className="text-slate-200">{result.message}</p>
              </div>
            </div>
          </Card>
        )}

        {result && result.kind === "success" && (
          <div className="space-y-6">
            <Card className={`p-8 border-2 ${statusMeta[result.data.status].card}`}>
              <div className="flex items-start gap-4">
                {statusMeta[result.data.status].icon}
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${statusMeta[result.data.status].accent}`}>
                    {statusMeta[result.data.status].label}
                  </h3>
                  <p className="text-slate-100 mb-4">{result.data.message}</p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-200">
                    <div>
                      <p className="text-slate-400">Kode Verifikasi</p>
                      <p className="font-mono text-base text-white">{result.data.code}</p>
                    </div>
                    {result.data.codeId && (
                      <div>
                        <p className="text-slate-400">ID Unit Produk</p>
                        <p className="font-mono text-base text-white">{result.data.codeId}</p>
                      </div>
                    )}
                    {result.data.productName && (
                      <div>
                        <p className="text-slate-400">Nama Produk</p>
                        <p className="text-white font-medium">{result.data.productName}</p>
                      </div>
                    )}
                    {result.data.distributor && (
                      <div>
                        <p className="text-slate-400">Distributor</p>
                        <p className="text-white font-medium">{result.data.distributor}</p>
                      </div>
                    )}
                    {typeof result.data.verificationCount === "number" && (
                      <div>
                        <p className="text-slate-400">Total Riwayat Verifikasi</p>
                        <p className="text-white font-medium">{result.data.verificationCount} kali</p>
                      </div>
                    )}
                    {result.data.firstVerifiedAt && (
                      <div>
                        <p className="text-slate-400">Pertama Diverifikasi</p>
                        <p className="text-white font-medium">{formatDateTime(result.data.firstVerifiedAt)}</p>
                      </div>
                    )}
                    {result.data.lastVerifiedAt && (
                      <div>
                        <p className="text-slate-400">Terakhir Diverifikasi</p>
                        <p className="text-white font-medium">{formatDateTime(result.data.lastVerifiedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {result.data.blockchainProof && (
              <Card className="bg-slate-900 border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Hash className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Jejak Blockchain</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-200">
                  <div>
                    <p className="text-slate-400">Hash Anchor Produk</p>
                    <p className="font-mono break-all text-xs text-orange-200">
                      {result.data.blockchainProof.anchorHash}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400">Tanggal Anchor</p>
                      <p className="text-white font-medium">{formatDate(result.data.blockchainProof.anchorDate)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Status Anchor</p>
                      <p className={result.data.blockchainProof.anchored ? "text-green-400 font-medium" : "text-amber-400 font-medium"}>
                        {result.data.blockchainProof.anchored
                          ? "Telah tercatat pada blockchain harian"
                          : "Menunggu penyegelan harian"}
                      </p>
                    </div>
                  </div>
                  {result.data.blockchainProof.anchored ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400">Index Blok</p>
                        <p className="text-white font-medium">#{result.data.blockchainProof.blockIndex}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Waktu Anchoring</p>
                        <p className="text-white font-medium">
                          {formatDateTime(result.data.blockchainProof.blockTimestamp)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-slate-400">Merkle Root</p>
                        <p className="font-mono break-all text-xs text-slate-200">
                          {result.data.blockchainProof.merkleRoot}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-slate-400">Hash Blok</p>
                        <p className="font-mono break-all text-xs text-slate-200">
                          {result.data.blockchainProof.blockHash}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300">
                      {`Event verifikasi akan dimasukkan ke blok anchor tanggal ${formatDate(
                        result.data.blockchainProof.anchorDate,
                      )}. Total antrean anchor untuk hari tersebut: ${
                        result.data.blockchainProof.pendingCount ?? 0
                      } transaksi.`}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {result.data.history && result.data.history.length > 0 && (
              <Card className="bg-slate-900 border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <History className="w-5 h-5 text-sky-400" />
                  <h3 className="text-lg font-semibold text-white">Riwayat Verifikasi Terakhir</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-200">
                  {result.data.history.map((entry) => (
                    <div key={`${entry.timestamp}-${entry.status}`} className="flex items-center justify-between">
                      <span>{formatDateTime(entry.timestamp)}</span>
                      <span className={`${statusMeta[entry.status].text} font-medium`}>
                        {statusMeta[entry.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <Shield className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="text-white font-semibold mb-2">Keamanan</h3>
            <p className="text-slate-400 text-sm">
              Verifikasi hash dilakukan di server dengan pepper rahasia dan jejak audit terjamin.
            </p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <Factory className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-white font-semibold mb-2">Transparan</h3>
            <p className="text-slate-400 text-sm">Distributor resmi tercatat dalam catatan verifikasi Anda.</p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <Hash className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-white font-semibold mb-2">Jejak Blockchain</h3>
            <p className="text-slate-400 text-sm">Merkle root harian menjamin integritas seluruh aktivasi kode.</p>
          </Card>
        </div>
      </section>
    </main>
  )
}

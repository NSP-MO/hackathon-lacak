"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    status: "authentic" | "counterfeit" | "error"
    message: string
    timestamp?: string
    productId?: string
  } | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      setResult({
        status: "error",
        message: "Please enter a product code",
      })
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

      if (response.ok) {
        setResult({
          status: "authentic",
          message: "Product verified as authentic!",
          timestamp: new Date().toLocaleString(),
          productId: data.productId,
        })
        setCode("")
      } else {
        setResult({
          status: "counterfeit",
          message: data.message || "This product could not be verified. It may be counterfeit.",
        })
      }
    } catch (error) {
      setResult({
        status: "error",
        message: "An error occurred during verification. Please try again.",
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
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Verify Your Product</h1>
          <p className="text-xl text-slate-300">Enter your 16-digit product code to verify authenticity</p>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-8 mb-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-200 mb-2">
                Product Code
              </label>
              <input
                id="code"
                type="text"
                placeholder="Enter 16-digit code (e.g., A1B2C3D4E5F6G7H8)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={16}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-2">Find this code on your product label or NFC chip</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Product"
              )}
            </Button>
          </form>
        </Card>

        {/* Result Display */}
        {result && (
          <Card
            className={`p-8 border-2 ${
              result.status === "authentic"
                ? "bg-green-500/10 border-green-500/50"
                : result.status === "counterfeit"
                  ? "bg-red-500/10 border-red-500/50"
                  : "bg-yellow-500/10 border-yellow-500/50"
            }`}
          >
            <div className="flex items-start gap-4">
              {result.status === "authentic" && <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />}
              {result.status === "counterfeit" && <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />}
              {result.status === "error" && <AlertCircle className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" />}

              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    result.status === "authentic"
                      ? "text-green-400"
                      : result.status === "counterfeit"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {result.status === "authentic" && "Authentic Product"}
                  {result.status === "counterfeit" && "Verification Failed"}
                  {result.status === "error" && "Error"}
                </h3>
                <p className="text-slate-300 mb-4">{result.message}</p>
                {result.timestamp && <p className="text-sm text-slate-400">Verified at: {result.timestamp}</p>}
                {result.productId && <p className="text-sm text-slate-400">Product ID: {result.productId}</p>}
              </div>
            </div>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <Shield className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="text-white font-semibold mb-2">Secure</h3>
            <p className="text-slate-400 text-sm">
              Your verification is processed securely with blockchain audit trails
            </p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-white font-semibold mb-2">Instant</h3>
            <p className="text-slate-400 text-sm">Get immediate results on product authenticity</p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <AlertCircle className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-white font-semibold mb-2">Reliable</h3>
            <p className="text-slate-400 text-sm">Backed by immutable blockchain records</p>
          </Card>
        </div>
      </section>
    </main>
  )
}

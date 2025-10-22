import Link from "next/link"
import { Shield, CheckCircle, Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold text-white">LACAK</span>
          </div>
          <div className="flex gap-4">
            <Link href="/verify">
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
                Verify Product
              </Button>
            </Link>
            <Link href="/admin">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Admin Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Authentic Products, <span className="text-orange-500">Verified</span> with Blockchain
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              LACAK is a revolutionary anti-counterfeit system combining single-use label activation with blockchain
              audit trails. Protect your brand, ensure consumer safety.
            </p>
            <div className="flex gap-4">
              <Link href="/verify">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Verify Now
                </Button>
              </Link>
              <Link href="/admin">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-400 text-white hover:bg-slate-800 bg-transparent"
                >
                  Admin Access
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded-lg p-6">
              <Lock className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-white font-semibold mb-2">Hash-Lock</h3>
              <p className="text-slate-400 text-sm">Single-use activation prevents cloning</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-lg p-6">
              <Zap className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-white font-semibold mb-2">Real-Time</h3>
              <p className="text-slate-400 text-sm">Instant verification on server</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg p-6">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-white font-semibold mb-2">Blockchain</h3>
              <p className="text-slate-400 text-sm">Immutable audit trail anchored daily</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-lg p-6">
              <Shield className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="text-white font-semibold mb-2">Privacy</h3>
              <p className="text-slate-400 text-sm">No PII stored on-chain</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-800/50 border-t border-slate-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">How LACAK Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
              <div className="bg-orange-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-500 font-bold text-lg">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Product Labeling</h3>
              <p className="text-slate-400">
                Each product receives a unique 16-digit hexadecimal code printed on a scratch-off label or NFC chip.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
              <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-500 font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Consumer Verification</h3>
              <p className="text-slate-400">
                Consumer enters the code on our portal. Server validates the hash and marks it as activated
                (spent=true).
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
              <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-500 font-bold text-lg">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Blockchain Audit</h3>
              <p className="text-slate-400">
                Daily Merkle root of all activations anchored to blockchain for immutable audit trail and dispute
                resolution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Protect Your Products?</h2>
          <p className="text-orange-100 mb-8 max-w-2xl mx-auto">
            Join the anti-counterfeit revolution. Start verifying products today with LACAK.
          </p>
          <Link href="/verify">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-slate-100">
              Start Verification
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}

import crypto from "crypto"

import { BLOCKCHAIN_SECRET, VERIFICATION_SECRET } from "@/lib/config"

export function computeVerificationHash(code: string, secret: string = VERIFICATION_SECRET): string {
  return crypto.createHash("sha256").update(`${code}${secret}`).digest("hex")
}

export function computeBlockchainAnchorHash(reference: string): string {
  return crypto.createHash("sha256").update(`${reference}${BLOCKCHAIN_SECRET}`).digest("hex")
}

export function generateRandomHexCode(existing: Set<string>): string {
  while (true) {
    const candidate = crypto.randomBytes(8).toString("hex").toUpperCase()
    if (!existing.has(candidate)) {
      return candidate
    }
  }
}

export function hashIp(ip?: string | null): string {
  if (!ip) {
    return "unknown"
  }

  return crypto.createHash("sha256").update(ip.trim()).digest("hex")
}

import { randomUUID } from "crypto"

import { appendAuditLog } from "@/lib/services/audit-service"
import {
  applyVerificationUpdate,
  findCodeByVerificationHash,
} from "@/lib/services/product-service"
import {
  BlockchainProof,
  recordVerificationEvent,
  getBlockchainProofForCode,
} from "@/lib/services/blockchain-service"
import { computeVerificationHash, hashIp } from "@/lib/utils/hash"

export type VerificationOutcome =
  | "TERVERIFIKASI"
  | "PERNAH_TERVERIFIKASI"
  | "TIDAK_TERVERIFIKASI"

export interface VerificationResult {
  status: VerificationOutcome
  message: string
  code: string
  productId?: string
  productName?: string
  distributor?: string
  codeId?: string
  verificationCount?: number
  firstVerifiedAt?: string
  lastVerifiedAt?: string
  history?: { timestamp: string; status: VerificationOutcome }[]
  blockchainProof?: BlockchainProof | null
}

export async function verifyProductCode(
  code: string,
  ipAddress?: string | null,
): Promise<VerificationResult> {
  const normalized = code.trim().toUpperCase()

  if (!/^[0-9A-F]{16}$/.test(normalized)) {
    throw new Error("Kode harus berformat 16 digit heksadesimal (0-9, A-F)")
  }

  const verificationHash = computeVerificationHash(normalized)
  const ipHash = hashIp(ipAddress)
  const timestamp = new Date().toISOString()

  const lookup = await findCodeByVerificationHash(verificationHash)

  if (!lookup) {
    try {
      await appendAuditLog({
        id: randomUUID(),
        timestamp,
        code: normalized,
        status: "TIDAK_TERVERIFIKASI",
        ipHash,
      })
    } catch (error) {
      console.error("Failed to append audit log for invalid verification:", error)
    }

    return {
      status: "TIDAK_TERVERIFIKASI",
      message: "Kode tidak terdaftar pada sistem LACAK atau produk palsu.",
      code: normalized,
      blockchainProof: null,
    }
  }

  const updateResult = await applyVerificationUpdate({
    batchId: lookup.batch.id,
    codeId: lookup.code.id,
    timestamp,
    ipHash,
  })

  if (!updateResult) {
    throw new Error("Gagal memperbarui status verifikasi produk")
  }

  try {
    await appendAuditLog({
      id: randomUUID(),
      timestamp,
      code: normalized,
      status: updateResult.status,
      ipHash,
      productId: updateResult.batch.id,
      productName: updateResult.batch.productName,
      distributor: updateResult.batch.distributor,
      codeId: updateResult.code.id,
    })
  } catch (error) {
    console.error("Failed to append audit log for valid verification:", error)
  }

  let blockchainProof: BlockchainProof | null = null

  if (!updateResult.code.blockchainAnchorHash) {
    console.warn(
      "Missing blockchain anchor hash for code",
      updateResult.code.id,
    )
  } else {
    try {
      await recordVerificationEvent({
        productId: updateResult.batch.id,
        productName: updateResult.batch.productName,
        distributor: updateResult.batch.distributor,
        codeId: updateResult.code.id,
        anchorHash: updateResult.code.blockchainAnchorHash,
        status: updateResult.status,
        timestamp,
      })
    } catch (error) {
      console.error("Failed to record blockchain verification event:", error)
    }

    try {
      blockchainProof = await getBlockchainProofForCode(
        updateResult.code.id,
        timestamp,
      )
    } catch (error) {
      console.error("Failed to load blockchain proof:", error)
    }
  }

  const message =
    updateResult.status === "TERVERIFIKASI"
      ? "Kode valid dan baru saja diverifikasi."
      : "Kode valid namun telah diverifikasi sebelumnya."

  return {
    status: updateResult.status,
    message,
    code: normalized,
    productId: updateResult.batch.id,
    productName: updateResult.batch.productName,
    distributor: updateResult.batch.distributor,
    codeId: updateResult.code.id,
    verificationCount: updateResult.code.verificationCount,
    firstVerifiedAt: updateResult.code.firstVerifiedAt,
    lastVerifiedAt: updateResult.code.lastVerifiedAt,
    history: updateResult.code.verificationHistory.slice(-5).map((entry) => ({
      timestamp: entry.timestamp,
      status: entry.status,
    })),
    blockchainProof,
  }
}

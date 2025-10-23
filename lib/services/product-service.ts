import { computeBlockchainAnchorHash, computeVerificationHash, generateRandomHexCode } from "@/lib/utils/hash"
import {
  findBatchById,
  listAllBatches,
  createBatch as dbCreateBatch,
  deleteBatch as dbDeleteBatch,
  findCodeByVerificationHash as dbFindCodeByVerificationHash,
  updateCodeVerification,
  getNextBatchCounter,
  checkLabelHashExists,
} from "@/lib/db/product-repository"

export type VerificationState = "UNUSED" | "TERVERIFIKASI" | "PERNAH_TERVERIFIKASI"

export interface VerificationHistoryEntry {
  timestamp: string
  status: Exclude<VerificationState, "UNUSED">
  ipHash: string
}

export interface ProductCode {
  id: string
  labelHash: string
  verificationHash: string
  blockchainAnchorHash: string
  status: VerificationState
  firstVerifiedAt?: string
  lastVerifiedAt?: string
  verificationCount: number
  verificationHistory: VerificationHistoryEntry[]
}

export interface ProductBatch {
  id: string
  productName: string
  distributor: string
  createdAt: string
  codes: ProductCode[]
}

interface ProductStore {
  counter: number
  batches: ProductBatch[]
}

const STORE_FILE = "products.json"

const defaultStore: ProductStore = {
  counter: 0,
  batches: [],
}

export interface ProductSummary {
  id: string
  productName: string
  distributor: string
  createdAt: string
  totalCodes: number
  verifiedCount: number
}

export async function listProductSummaries(): Promise<ProductSummary[]> {
  return await listAllBatches()
}

export async function getProductBatchById(id: string): Promise<ProductBatch | null> {
  return await findBatchById(id)
}

export interface CreateProductBatchInput {
  productName: string
  distributor: string
  quantity: number
}

export async function createProductBatch({
  productName,
  distributor,
  quantity,
}: CreateProductBatchInput): Promise<ProductBatch> {
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero")
  }

  const nextCounter = (await getNextBatchCounter()) + 1
  const batchId = `PROD-${String(nextCounter).padStart(4, "0")}`
  const createdAt = new Date().toISOString()

  const codes: ProductCode[] = []

  for (let i = 0; i < quantity; i++) {
    let labelHash: string
    let attempts = 0
    const maxAttempts = 100

    // Generate unique label hash
    do {
      labelHash = generateRandomHexCode(new Set())
      attempts++
      if (attempts > maxAttempts) {
        throw new Error("Failed to generate unique label hash after maximum attempts")
      }
    } while (await checkLabelHashExists(labelHash))

    const codeId = `${batchId}-${String(i + 1).padStart(4, "0")}`

    codes.push({
      id: codeId,
      labelHash,
      verificationHash: computeVerificationHash(labelHash),
      blockchainAnchorHash: computeBlockchainAnchorHash(codeId),
      status: "UNUSED",
      verificationCount: 0,
      verificationHistory: [],
    })
  }

  const batch: ProductBatch = {
    id: batchId,
    productName,
    distributor,
    createdAt,
    codes,
  }

  await dbCreateBatch(batch)

  return batch
}

export async function deleteProductBatch(id: string): Promise<boolean> {
  return await dbDeleteBatch(id)
}

export interface CodeLookupResult {
  batch: ProductBatch
  code: ProductCode
}

export async function findCodeByVerificationHash(hash: string): Promise<CodeLookupResult | null> {
  return await dbFindCodeByVerificationHash(hash)
}

export interface VerificationUpdatePayload {
  batchId: string
  codeId: string
  timestamp: string
  ipHash: string
}

export interface VerificationUpdateResult {
  batch: ProductBatch
  code: ProductCode
  status: Exclude<VerificationState, "UNUSED">
}

export async function applyVerificationUpdate({
  batchId,
  codeId,
  timestamp,
  ipHash,
}: VerificationUpdatePayload): Promise<VerificationUpdateResult | null> {
  const batch = await findBatchById(batchId)
  if (!batch) {
    return null
  }

  const code = batch.codes.find((c) => c.id === codeId)
  if (!code) {
    return null
  }

  let status: Exclude<VerificationState, "UNUSED">

  if (code.status === "UNUSED") {
    status = "TERVERIFIKASI"
    code.status = "TERVERIFIKASI"
    code.firstVerifiedAt = timestamp
  } else {
    status = "PERNAH_TERVERIFIKASI"
    code.status = "PERNAH_TERVERIFIKASI"
    if (!code.firstVerifiedAt) {
      code.firstVerifiedAt = timestamp
    }
  }

  code.lastVerifiedAt = timestamp
  code.verificationCount += 1
  code.verificationHistory.push({
    timestamp,
    status,
    ipHash,
  })

  // Update in database
  await updateCodeVerification(codeId, {
    status: code.status,
    verificationCount: code.verificationCount,
    firstVerifiedAt: code.firstVerifiedAt,
    lastVerifiedAt: code.lastVerifiedAt,
    verificationHistory: code.verificationHistory,
  })

  return {
    batch,
    code,
    status,
  }
}

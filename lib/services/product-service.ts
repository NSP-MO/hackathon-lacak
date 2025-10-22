import { mutateStore, readStore } from "@/lib/utils/file-storage"
import {
  computeBlockchainAnchorHash,
  computeVerificationHash,
  generateRandomHexCode,
} from "@/lib/utils/hash"

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
  const store = await readStore(STORE_FILE, defaultStore)

  return store.batches.map((batch) => ({
    id: batch.id,
    productName: batch.productName,
    distributor: batch.distributor,
    createdAt: batch.createdAt,
    totalCodes: batch.codes.length,
    verifiedCount: batch.codes.filter((code) => code.status !== "UNUSED").length,
  }))
}

export async function getProductBatchById(id: string): Promise<ProductBatch | null> {
  const store = await readStore(STORE_FILE, defaultStore)
  const batch = store.batches.find((entry) => entry.id === id)

  if (!batch) {
    return null
  }

  return JSON.parse(JSON.stringify(batch)) as ProductBatch
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

  let createdBatch: ProductBatch | null = null

  await mutateStore(STORE_FILE, defaultStore, (state) => {
    const nextCounter = state.counter + 1
    const batchId = `PROD-${String(nextCounter).padStart(4, "0")}`
    const createdAt = new Date().toISOString()

    const existingCodes = new Set<string>()
    for (const batch of state.batches) {
      for (const code of batch.codes) {
        existingCodes.add(code.labelHash)
      }
    }

    const codes: ProductCode[] = []

    for (let i = 0; i < quantity; i++) {
      const labelHash = generateRandomHexCode(existingCodes)
      existingCodes.add(labelHash)
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

    createdBatch = {
      id: batchId,
      productName,
      distributor,
      createdAt,
      codes,
    }

    state.counter = nextCounter
    state.batches.push(createdBatch)

    return state
  })

  if (!createdBatch) {
    throw new Error("Failed to create product batch")
  }

  return createdBatch
}

export async function deleteProductBatch(id: string): Promise<boolean> {
  let deleted = false

  await mutateStore(STORE_FILE, defaultStore, (state) => {
    const originalLength = state.batches.length
    state.batches = state.batches.filter((batch) => batch.id !== id)
    deleted = state.batches.length !== originalLength
    return state
  })

  return deleted
}

export interface CodeLookupResult {
  batch: ProductBatch
  code: ProductCode
}

export async function findCodeByVerificationHash(hash: string): Promise<CodeLookupResult | null> {
  const store = await readStore(STORE_FILE, defaultStore)

  for (const batch of store.batches) {
    const code = batch.codes.find((entry) => entry.verificationHash === hash)
    if (code) {
      return { batch, code }
    }
  }

  return null
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
  let result: VerificationUpdateResult | null = null

  await mutateStore(STORE_FILE, defaultStore, (state) => {
    const batch = state.batches.find((entry) => entry.id === batchId)

    if (!batch) {
      return state
    }

    const code = batch.codes.find((entry) => entry.id === codeId)

    if (!code) {
      return state
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

    result = {
      batch,
      code,
      status,
    }

    return state
  })

  return result
}

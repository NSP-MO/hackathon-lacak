import crypto from "crypto"

import { BLOCKCHAIN_DIFFICULTY } from "@/lib/config"
import {
  getLatestBlock,
  getAllBlocks,
  insertBlock,
  getPendingAnchors,
  getAllPendingAnchors,
  upsertPendingAnchors,
  deletePendingAnchors,
  findEventByCodeId,
  getTotalActivations,
} from "@/lib/db/blockchain-repository"

export type BlockchainVerificationStatus = "TERVERIFIKASI" | "PERNAH_TERVERIFIKASI"

export interface BlockchainEvent {
  productId: string
  productName: string
  distributor: string
  codeId: string
  anchorHash: string
  status: BlockchainVerificationStatus
  timestamp: string
}

export interface BlockchainBlock {
  index: number
  timestamp: string
  previousHash: string
  merkleRoot: string
  nonce: number
  hash: string
  date: string
  events: BlockchainEvent[]
}

interface BlockchainState {
  chain: BlockchainBlock[]
  pendingAnchors: Record<string, BlockchainEvent[]>
}

const STORE_FILE = "blockchain.json"

const defaultState: BlockchainState = {
  chain: [],
  pendingAnchors: {},
}

function computeMerkleRoot(events: BlockchainEvent[]): string {
  if (events.length === 0) {
    return crypto.createHash("sha256").update("GENESIS").digest("hex")
  }

  let hashes = events.map((event) => crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex"))

  while (hashes.length > 1) {
    const next: string[] = []

    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i]
      const right = hashes[i + 1] ?? hashes[i]
      next.push(
        crypto
          .createHash("sha256")
          .update(left + right)
          .digest("hex"),
      )
    }

    hashes = next
  }

  return hashes[0]
}

function computeBlockHash(block: {
  index: number
  timestamp: string
  previousHash: string
  merkleRoot: string
  nonce: number
  date: string
}): string {
  return crypto
    .createHash("sha256")
    .update(`${block.index}|${block.previousHash}|${block.timestamp}|${block.merkleRoot}|${block.nonce}|${block.date}`)
    .digest("hex")
}

function mineBlock(base: Omit<BlockchainBlock, "hash" | "nonce">): BlockchainBlock {
  let nonce = 0
  let hash = ""

  while (true) {
    hash = computeBlockHash({ ...base, nonce })
    if (hash.startsWith("0".repeat(BLOCKCHAIN_DIFFICULTY))) {
      break
    }
    nonce += 1
  }

  return { ...base, nonce, hash }
}

async function ensureGenesis() {
  const latestBlock = await getLatestBlock()

  if (latestBlock) {
    return
  }

  const timestamp = "2024-01-01T00:00:00.000Z"
  const date = timestamp.slice(0, 10)
  const baseBlock: Omit<BlockchainBlock, "hash" | "nonce"> = {
    index: 0,
    previousHash: "0".repeat(64),
    timestamp,
    merkleRoot: computeMerkleRoot([]),
    date,
    events: [],
  }

  const genesisBlock = mineBlock(baseBlock)
  await insertBlock(genesisBlock)
}

async function anchorPendingUpTo(cutoffDate: string) {
  await ensureGenesis()

  const pendingAnchors = await getAllPendingAnchors()
  const dates = Object.keys(pendingAnchors).sort()

  for (const date of dates) {
    if (date > cutoffDate) {
      continue
    }

    const events = pendingAnchors[date]
    if (!events || events.length === 0) {
      await deletePendingAnchors(date)
      continue
    }

    const previous = await getLatestBlock()
    if (!previous) {
      throw new Error("No genesis block found")
    }

    const blockBase: Omit<BlockchainBlock, "hash" | "nonce"> = {
      index: previous.index + 1,
      previousHash: previous.hash,
      timestamp: new Date().toISOString(),
      merkleRoot: computeMerkleRoot(events),
      date,
      events,
    }

    const block = mineBlock(blockBase)
    await insertBlock(block)
    await deletePendingAnchors(date)
  }
}

export interface RecordEventInput {
  productId: string
  productName: string
  distributor: string
  codeId: string
  anchorHash: string
  status: BlockchainVerificationStatus
  timestamp: string
}

export async function recordVerificationEvent(event: RecordEventInput) {
  try {
    console.log("[v0] Recording verification event:", event.codeId)

    await ensureGenesis()

    const eventDate = event.timestamp.slice(0, 10)
    const existingEvents = await getPendingAnchors(eventDate)
    existingEvents.push(event)

    await upsertPendingAnchors(eventDate, existingEvents)
    await anchorPendingUpTo(eventDate)

    console.log("[v0] Verification event recorded successfully")
  } catch (error) {
    console.error("[v0] Error recording verification event:", error)
    throw error
  }
}

async function flushAnchorsUpTo(date: string): Promise<void> {
  await anchorPendingUpTo(date)
}

export interface BlockchainProof {
  anchorHash: string
  anchorDate: string
  status: BlockchainVerificationStatus
  anchored: boolean
  blockHash?: string
  blockIndex?: number
  blockTimestamp?: string
  merkleRoot?: string
  pendingCount?: number
}

export async function getBlockchainProofForCode(codeId: string, timestamp?: string): Promise<BlockchainProof | null> {
  try {
    console.log("[v0] Getting blockchain proof for code:", codeId)
    const today = new Date().toISOString().slice(0, 10)
    await flushAnchorsUpTo(today)

    const result = await findEventByCodeId(codeId)

    if (result) {
      const { event, block } = result
      if (!timestamp || event.timestamp === timestamp) {
        console.log("[v0] Blockchain proof found for code:", codeId)
        return {
          anchorHash: event.anchorHash,
          anchorDate: block.date,
          status: event.status,
          anchored: true,
          blockHash: block.hash,
          blockIndex: block.index,
          blockTimestamp: block.timestamp,
          merkleRoot: block.merkleRoot,
        }
      }
    }

    // Check pending anchors
    const pendingAnchors = await getAllPendingAnchors()
    const pendingDates = Object.keys(pendingAnchors).sort().reverse()

    for (const date of pendingDates) {
      const events = pendingAnchors[date]
      for (const event of events) {
        if (event.codeId === codeId && (!timestamp || event.timestamp === timestamp)) {
          console.log("[v0] Blockchain proof found in pending anchors for code:", codeId)
          return {
            anchorHash: event.anchorHash,
            anchorDate: date,
            status: event.status,
            anchored: false,
            pendingCount: events.length,
          }
        }
      }
    }

    console.log("[v0] No blockchain proof found for code:", codeId)
    return null
  } catch (error) {
    console.error("[v0] Error getting blockchain proof:", error)
    throw error
  }
}

export interface BlockchainStatusSummary {
  lastAnchorDate: string
  totalActivations: number
  latestMerkleRoot: string
  network: string
  contractAddress: string
  pendingToday: number
}

export async function getBlockchainStatus(): Promise<BlockchainStatusSummary> {
  try {
    console.log("[v0] Getting blockchain status...")
    const today = new Date().toISOString().slice(0, 10)
    await flushAnchorsUpTo(today)

    const allBlocks = await getAllBlocks()
    const nonGenesisBlocks = allBlocks.filter((block) => block.index > 0)
    const lastBlock = nonGenesisBlocks[nonGenesisBlocks.length - 1]
    const totalActivations = await getTotalActivations()
    const lastAnchorDate = lastBlock ? lastBlock.date : "Belum ada anchor"
    const latestMerkleRoot = lastBlock ? lastBlock.merkleRoot : "-"
    const pendingEvents = await getPendingAnchors(today)
    const pendingToday = pendingEvents.length

    const status = {
      lastAnchorDate,
      totalActivations,
      latestMerkleRoot,
      network: "Ethereum Sepolia Testnet",
      contractAddress: "0x51E2620A7ab1411f4f626fb68d98E68f58c31167",
      pendingToday,
    }

    console.log("[v0] Blockchain status retrieved:", status)
    return status
  } catch (error) {
    console.error("[v0] Error getting blockchain status:", error)
    throw error
  }
}

import crypto from "crypto"

import { BLOCKCHAIN_DIFFICULTY } from "@/lib/config"
import { mutateStore } from "@/lib/utils/file-storage"

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

  let hashes = events.map((event) =>
    crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex"),
  )

  while (hashes.length > 1) {
    const next: string[] = []

    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i]
      const right = hashes[i + 1] ?? hashes[i]
      next.push(crypto.createHash("sha256").update(left + right).digest("hex"))
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
    .update(
      `${block.index}|${block.previousHash}|${block.timestamp}|${block.merkleRoot}|${block.nonce}|${block.date}`,
    )
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

function ensureGenesis(state: BlockchainState) {
  if (state.chain.length > 0) {
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

  state.chain.push(mineBlock(baseBlock))
}

function anchorPendingUpTo(state: BlockchainState, cutoffDate: string) {
  ensureGenesis(state)
  const dates = Object.keys(state.pendingAnchors).sort()

  for (const date of dates) {
    if (date > cutoffDate) {
      continue
    }

    const events = state.pendingAnchors[date]
    if (!events || events.length === 0) {
      delete state.pendingAnchors[date]
      continue
    }

    const previous = state.chain[state.chain.length - 1]
    const blockBase: Omit<BlockchainBlock, "hash" | "nonce"> = {
      index: previous.index + 1,
      previousHash: previous.hash,
      timestamp: new Date().toISOString(),
      merkleRoot: computeMerkleRoot(events),
      date,
      events,
    }

    const block = mineBlock(blockBase)
    state.chain.push(block)
    delete state.pendingAnchors[date]
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
  await mutateStore(STORE_FILE, defaultState, (state) => {
    ensureGenesis(state)

    const eventDate = event.timestamp.slice(0, 10)
    if (!state.pendingAnchors[eventDate]) {
      state.pendingAnchors[eventDate] = []
    }

    state.pendingAnchors[eventDate].push(event)

    anchorPendingUpTo(state, eventDate)

    return state
  })
}

async function flushAnchorsUpTo(date: string): Promise<BlockchainState> {
  return mutateStore(STORE_FILE, defaultState, (state) => {
    anchorPendingUpTo(state, date)
    return state
  })
}

function cloneState(state: BlockchainState): BlockchainState {
  return {
    chain: state.chain.map((block) => ({ ...block, events: block.events.map((event) => ({ ...event })) })),
    pendingAnchors: Object.fromEntries(
      Object.entries(state.pendingAnchors).map(([key, value]) => [
        key,
        value.map((event) => ({ ...event })),
      ]),
    ),
  }
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

export async function getBlockchainProofForCode(
  codeId: string,
  timestamp?: string,
): Promise<BlockchainProof | null> {
  const today = new Date().toISOString().slice(0, 10)
  const state = await flushAnchorsUpTo(today)
  const snapshot = cloneState(state)

  for (let i = snapshot.chain.length - 1; i >= 0; i--) {
    const block = snapshot.chain[i]
    for (const event of block.events) {
      if (event.codeId === codeId && (!timestamp || event.timestamp === timestamp)) {
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
  }

  const pendingDates = Object.keys(snapshot.pendingAnchors).sort().reverse()

  for (const date of pendingDates) {
    const events = snapshot.pendingAnchors[date]
    for (const event of events) {
      if (event.codeId === codeId && (!timestamp || event.timestamp === timestamp)) {
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

  return null
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
  const today = new Date().toISOString().slice(0, 10)
  const state = await flushAnchorsUpTo(today)

  const nonGenesisBlocks = state.chain.filter((block) => block.index > 0)
  const lastBlock = nonGenesisBlocks[nonGenesisBlocks.length - 1]
  const totalActivations = nonGenesisBlocks.reduce((acc, block) => acc + block.events.length, 0)
  const lastAnchorDate = lastBlock ? lastBlock.date : "Belum ada anchor"
  const latestMerkleRoot = lastBlock ? lastBlock.merkleRoot : "-"
  const pendingToday = state.pendingAnchors[today]?.length ?? 0

  return {
    lastAnchorDate,
    totalActivations,
    latestMerkleRoot,
    network: "Ethereum Sepolia Testnet",
    contractAddress: "0x51E2620A7ab1411f4f626fb68d98E68f58c31167",
    pendingToday,
  }
}

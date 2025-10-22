import { promises as fs } from "fs"
import path from "path"

import { DATA_DIR } from "@/lib/config"
import { withLock } from "@/lib/utils/mutex"

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function readFileIfExists<T>(filePath: string): Promise<T | undefined> {
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    return JSON.parse(raw) as T
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return undefined
    }
    throw error
  }
}

async function writeFileAtomic<T>(filePath: string, data: T) {
  await ensureDir(path.dirname(filePath))
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8")
  await fs.rename(tempPath, filePath)
}

export async function readStore<T>(fileName: string, defaultValue: T): Promise<T> {
  const filePath = path.join(DATA_DIR, fileName)
  const existing = await readFileIfExists<T>(filePath)

  if (existing !== undefined) {
    return existing
  }

  await writeFileAtomic(filePath, defaultValue)
  return defaultValue
}

export async function mutateStore<T>(
  fileName: string,
  defaultValue: T,
  mutator: (state: T) => Promise<T | void> | T | void,
): Promise<T> {
  const filePath = path.join(DATA_DIR, fileName)

  return withLock(filePath, async () => {
    const state = await readStore(fileName, defaultValue)
    const updated = ((await mutator(state)) ?? state) as T
    await writeFileAtomic(filePath, updated)
    return updated
  })
}

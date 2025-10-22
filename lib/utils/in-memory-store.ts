// This replaces file-based storage which doesn't work in the browser runtime

interface StoreData {
  [key: string]: any
}

const store: StoreData = {}
const locks: Map<string, Promise<void>> = new Map()

async function acquireLock(key: string): Promise<() => void> {
  while (locks.has(key)) {
    await locks.get(key)
  }

  let releaseLock: () => void
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve
  })

  locks.set(key, lockPromise)

  return () => {
    locks.delete(key)
    releaseLock()
  }
}

export async function readStore<T>(fileName: string, defaultValue: T): Promise<T> {
  if (!(fileName in store)) {
    store[fileName] = defaultValue
  }
  return store[fileName] as T
}

export async function mutateStore<T>(
  fileName: string,
  defaultValue: T,
  mutator: (state: T) => Promise<T | void> | T | void,
): Promise<T> {
  const releaseLock = await acquireLock(fileName)

  try {
    const state = await readStore(fileName, defaultValue)
    const updated = ((await mutator(state)) ?? state) as T
    store[fileName] = updated
    return updated
  } finally {
    releaseLock()
  }
}

class Mutex {
  private mutex = Promise.resolve()

  private async acquire(): Promise<() => void> {
    let release: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })

    const previous = this.mutex
    this.mutex = previous.then(() => pending)

    await previous

    return release!
  }

  async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    const release = await this.acquire()

    try {
      return await callback()
    } finally {
      release()
    }
  }
}

const globalKey = Symbol.for("__LACAK_MUTEX_MAP__")

type MutexMap = Map<string, Mutex>

const mutexMap: MutexMap =
  ((globalThis as unknown as { [globalKey]?: MutexMap })[globalKey] ||= new Map())

export function getMutex(key: string): Mutex {
  let mutex = mutexMap.get(key)

  if (!mutex) {
    mutex = new Mutex()
    mutexMap.set(key, mutex)
  }

  return mutex
}

export async function withLock<T>(key: string, callback: () => Promise<T>): Promise<T> {
  const mutex = getMutex(key)
  return mutex.runExclusive(callback)
}

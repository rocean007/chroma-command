/**
 * IndexedDB for larger functional data — only open when functional consent is true.
 */

const DB_NAME = 'chroma_command_functional'
const DB_VERSION = 1

export async function openFunctionalDB(allow: boolean): Promise<IDBDatabase | null> {
  if (!allow || typeof indexedDB === 'undefined') return null
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv', { keyPath: 'key' })
      }
    }
  })
}

export async function idbPut(store: IDBDatabase, key: string, value: unknown): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = store.transaction('kv', 'readwrite')
    tx.objectStore('kv').put({ key, value, updatedAt: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function idbGet<T>(store: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = store.transaction('kv', 'readonly')
    const rq = tx.objectStore('kv').get(key)
    rq.onsuccess = () => resolve((rq.result as { value?: T } | undefined)?.value)
    rq.onerror = () => reject(rq.error)
  })
}

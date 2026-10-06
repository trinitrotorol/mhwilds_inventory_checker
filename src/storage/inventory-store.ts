import { createId, exportProfile, normalizeProfile, parseBoundedJson, parseProfile } from '../domain'
import type { Dependencies, InventoryProfile } from '../domain'

export const INVENTORY_STORAGE_KEY = 'mhwilds.inventory.profile.v1'
export interface StorageAdapter { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface LockAdapter { request<T>(name: string, callback: () => Promise<T> | T): Promise<T> }
export interface ReadState {
  status: 'empty' | 'ready' | 'corrupt' | 'unavailable'
  profile: InventoryProfile | null
  raw: string | null
  error?: string
}
export interface WriteState {
  status: 'saved' | 'conflict' | 'failed'
  profile: InventoryProfile | null
  raw: string | null
  error?: string
}
export interface StoreOptions extends Dependencies {
  storage?: StorageAdapter
  eventTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>
  locks?: LockAdapter | null
}
const listeners = new WeakMap<StorageAdapter, Set<() => void>>()
const queues = new WeakMap<StorageAdapter, Promise<unknown>>()
function message(error: unknown): string {
  // DOMExceptions can originate from another realm (iframe/adapter).
  const name = error !== null && typeof error === 'object' && 'name' in error ? error.name : null
  if (name === 'QuotaExceededError') return '保存領域が不足しています。未保存の内容をJSONで退避してください。'
  if (name === 'SecurityError') return 'ブラウザが保存領域へのアクセスを拒否しました。'
  return '保存に失敗しました。未保存の内容をJSONで退避してください。'
}
export function createInventoryStore(options: StoreOptions = {}) {
  let storage: StorageAdapter | undefined
  try { storage = options.storage ?? globalThis.localStorage } catch { /* Access can throw before getItem. */ }
  const events = options.eventTarget ?? (typeof window === 'undefined' ? undefined : window)
  const locks = options.locks === undefined ? globalThis.navigator?.locks : options.locks
  const now = options.now ?? (() => new Date().toISOString())
  const id = options.id ?? createId
  const ownSubscriptions = new Set<() => void>()
  function read(): ReadState {
    if (!storage) return { status: 'unavailable', profile: null, raw: null, error: 'ブラウザ内の保存領域を利用できません。' }
    let raw: string | null
    try { raw = storage.getItem(INVENTORY_STORAGE_KEY) } catch (error) { return { status: 'unavailable', profile: null, raw: null, error: message(error) } }
    if (raw === null) return { status: 'empty', profile: null, raw: null }
    try { return { status: 'ready', profile: normalizeProfile(parseProfile(parseBoundedJson(raw))), raw } }
    catch { return { status: 'corrupt', profile: null, raw, error: '保存データが破損しているか未対応の形式です。元データを退避してから明示的に復旧してください。' } }
  }
  function subscribe(callback: () => void): () => void {
    if (storage) {
      let callbacks = listeners.get(storage)
      if (!callbacks) { callbacks = new Set(); listeners.set(storage, callbacks) }
      callbacks.add(callback)
    }
    const onStorage = (event: Event) => {
      const change = event as StorageEvent
      if ((change.key === INVENTORY_STORAGE_KEY || change.key === null) && (!change.storageArea || change.storageArea === storage)) callback()
    }
    events?.addEventListener('storage', onStorage)
    const unsubscribe = () => { if (storage) listeners.get(storage)?.delete(callback); events?.removeEventListener('storage', onStorage); ownSubscriptions.delete(unsubscribe) }
    ownSubscriptions.add(unsubscribe)
    return unsubscribe
  }
  const notify = () => { if (storage) for (const listener of listeners.get(storage) ?? []) { try { listener() } catch { /* A subscriber cannot turn a persisted write into failure. */ } } }
  async function persist(profile: InventoryProfile, expectedRaw: string | null, recovery: boolean): Promise<WriteState> {
    const operation = (): WriteState => {
      const current = read()
      if (!storage || current.status === 'unavailable') return { status: 'failed', profile, raw: current.raw, error: current.error }
      if (current.raw !== expectedRaw) return { status: 'conflict', profile: current.profile, raw: current.raw, error: '別の変更が保存されました。最新データを再読み込みしてください。' }
      if (current.status === 'corrupt' && !recovery) return { status: 'failed', profile, raw: current.raw, error: current.error }
      try {
        let next = normalizeProfile(profile)
        const content = (p: InventoryProfile) => JSON.stringify({ ...p, updated_at: '' })
        if (current.profile && content(next) === content(current.profile)) return { status: 'saved', profile: current.profile, raw: current.raw }
        next = normalizeProfile({ ...next, updated_at: now() })
        const raw = exportProfile(next)
        parseBoundedJson(raw)
        if (recovery && current.raw !== null) {
          const backupKey = `${INVENTORY_STORAGE_KEY}.recovery.${id()}`
          if (storage.getItem(backupKey) !== null) return { status: 'failed', profile, raw: current.raw, error: '退避IDが重複しました。復旧を再実行してください。' }
          storage.setItem(backupKey, current.raw)
        }
        storage.setItem(INVENTORY_STORAGE_KEY, raw)
        notify()
        return { status: 'saved', profile: next, raw }
      } catch (error) { return { status: 'failed', profile, raw: current.raw, error: message(error) } }
    }
    try {
      if (locks) return await locks.request(INVENTORY_STORAGE_KEY, operation)
      // Web Locks unavailable: serialize in this tab and use immediate CAS.
      // localStorage cannot guarantee a transaction across two different tabs.
      if (!storage) return operation()
      const previous = queues.get(storage) ?? Promise.resolve()
      const next = previous.catch(() => undefined).then(operation)
      queues.set(storage, next)
      return await next
    } catch (error) { return { status: 'failed', profile, raw: expectedRaw, error: message(error) } }
  }
  return {
    read, subscribe,
    write: (profile: InventoryProfile, expectedRaw: string | null) => persist(profile, expectedRaw, false),
    recover: (profile: InventoryProfile, expectedRaw: string | null) => persist(profile, expectedRaw, true),
    dispose: () => { for (const unsubscribe of ownSubscriptions) unsubscribe() },
    concurrency: locks ? 'web-locks' as const : 'best-effort-cas' as const,
  }
}
export type InventoryStore = ReturnType<typeof createInventoryStore>

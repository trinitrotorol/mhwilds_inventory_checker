import { describe, expect, it, vi } from 'vitest'
import { createInventoryStore, INVENTORY_STORAGE_KEY } from './index'
import type { LockAdapter, StorageAdapter } from './index'
import { exportProfile } from '../domain'
import { syntheticProfile } from '../test/domain-fixtures'

function memoryStorage(): StorageAdapter & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: vi.fn((key: string) => data.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { data.set(key, value) }) }
}
const now = () => '2026-10-06T01:00:00.000Z'

describe('central storage and recovery', () => {
  it('reads empty, writes canonical data, persists across adapters and avoids no-op writes', async () => {
    const storage = memoryStorage(); const store = createInventoryStore({ storage, now, locks: null })
    expect(store.read().status).toBe('empty')
    const saved = await store.write(syntheticProfile(), null)
    expect(saved.status).toBe('saved')
    expect(saved.profile?.updated_at).toBe(now())
    expect(createInventoryStore({ storage }).read().profile).toEqual(saved.profile)
    await store.write({ ...saved.profile!, updated_at: '2026-01-01T00:00:00.000Z' }, saved.raw)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })
  it('preserves zero/multiple quantities correctly and unknown historical IDs', async () => {
    const storage = memoryStorage(); const store = createInventoryStore({ storage, now })
    const profile = syntheticProfile(); profile.decorations = [{ decoration_id: 'orphan', quantity: 9 }, { decoration_id: 'test:attack-jewel', quantity: 0 }]
    await store.write(profile, null)
    expect(store.read().profile?.decorations).toEqual([{ decoration_id: 'orphan', quantity: 9 }])
    expect(store.read().profile?.fixed_charms[0]!.quantity).toBe(3)
  })
  it.each(['not json', '{"schema_version":2}', '{"schema_version":1}'])('never auto-overwrites corrupt or unsupported data %s', async (raw) => {
    const storage = memoryStorage(); storage.data.set(INVENTORY_STORAGE_KEY, raw)
    const store = createInventoryStore({ storage, now })
    expect(store.read()).toMatchObject({ status: 'corrupt', raw, profile: null })
    expect((await store.write(syntheticProfile(), raw)).status).toBe('failed')
    expect(storage.getItem(INVENTORY_STORAGE_KEY)).toBe(raw)
    expect(storage.setItem).not.toHaveBeenCalled()
  })
  it('explicit recovery keeps exact raw backup and rejects stale recovery attempts', async () => {
    const storage = memoryStorage(); storage.data.set(INVENTORY_STORAGE_KEY, 'raw corruption')
    const store = createInventoryStore({ storage, now, id: () => 'recovery-id' })
    expect((await store.recover(syntheticProfile(), 'older corruption')).status).toBe('conflict')
    expect((await store.recover(syntheticProfile(), 'raw corruption')).status).toBe('saved')
    expect(storage.getItem(`${INVENTORY_STORAGE_KEY}.recovery.recovery-id`)).toBe('raw corruption')
    expect(store.read().status).toBe('ready')
  })
  it('fails closed if a raw recovery backup cannot be written or its identity collides', async () => {
    const storage = memoryStorage(); storage.data.set(INVENTORY_STORAGE_KEY, 'corrupt')
    storage.data.set(`${INVENTORY_STORAGE_KEY}.recovery.same-id`, 'previous corruption')
    const store = createInventoryStore({ storage, id: () => 'same-id' })
    expect((await store.recover(syntheticProfile(), 'corrupt')).status).toBe('failed')
    expect(storage.getItem(INVENTORY_STORAGE_KEY)).toBe('corrupt')
    expect(storage.getItem(`${INVENTORY_STORAGE_KEY}.recovery.same-id`)).toBe('previous corruption')
    const quota = { getItem: () => 'corrupt', setItem: () => { throw new DOMException('quota', 'QuotaExceededError') } }
    expect((await createInventoryStore({ storage: quota }).recover(syntheticProfile(), 'corrupt')).status).toBe('failed')
  })
  it('quota and security failures retain unsaved profile and never claim success', async () => {
    const storage = { getItem: () => null, setItem: () => { throw new DOMException('quota', 'QuotaExceededError') } }
    const result = await createInventoryStore({ storage }).write(syntheticProfile(), null)
    expect(result).toMatchObject({ status: 'failed', profile: syntheticProfile() })
    expect(result.error).toContain('不足')
    const denied = createInventoryStore({ storage: { getItem: () => { throw new DOMException('security', 'SecurityError') }, setItem: vi.fn() } })
    expect(denied.read().status).toBe('unavailable')
    expect((await denied.write(syntheticProfile(), null)).status).toBe('failed')
  })
  it('rejects malformed direct writes before touching storage', async () => {
    const storage = memoryStorage(); const store = createInventoryStore({ storage })
    const profile = syntheticProfile(); profile.decorations[0]!.quantity = -1
    expect((await store.write(profile, null)).status).toBe('failed')
    expect(storage.setItem).not.toHaveBeenCalled()
  })
})

describe('concurrent editing and subscriptions', () => {
  it('rejects an obsolete draft/import preview even before a storage event arrives', async () => {
    const storage = memoryStorage(); const a = createInventoryStore({ storage, now }); const b = createInventoryStore({ storage, now })
    const original = await a.write(syntheticProfile(), null)
    const changed = syntheticProfile(); changed.decorations[0]!.quantity = 3
    await b.write(changed, original.raw)
    const obsolete = syntheticProfile(); obsolete.decorations[0]!.quantity = 1
    const result = await a.write(obsolete, original.raw)
    expect(result.status).toBe('conflict')
    expect(a.read().profile?.decorations[0]!.quantity).toBe(3)
  })
  it('serializes stores in the same tab; concurrent writes with same baseline cannot both win', async () => {
    const storage = memoryStorage(); const a = createInventoryStore({ storage, locks: null, now }); const b = createInventoryStore({ storage, locks: null, now })
    const second = syntheticProfile(); second.decorations[0]!.quantity = 8
    const results = await Promise.all([a.write(syntheticProfile(), null), b.write(second, null)])
    expect(results.map((r) => r.status)).toEqual(['saved', 'conflict'])
    expect(a.concurrency).toBe('best-effort-cas')
  })
  it('uses shared Web Locks and rechecks the baseline inside the acquired lock', async () => {
    const storage = memoryStorage(); let release: (() => void) | undefined
    const entered = new Promise<void>((resolve) => { release = resolve })
    const request = vi.fn()
    const locks: LockAdapter = { request: async <T,>(name: string, callback: () => Promise<T> | T): Promise<T> => { request(name); await entered; return callback() } }
    const store = createInventoryStore({ storage, locks, now })
    const writing = store.write(syntheticProfile(), null)
    const external = syntheticProfile(); external.decorations[0]!.quantity = 7
    storage.data.set(INVENTORY_STORAGE_KEY, exportProfile(external))
    release!()
    expect((await writing).status).toBe('conflict')
    expect(request).toHaveBeenCalledWith(INVENTORY_STORAGE_KEY)
    expect(store.concurrency).toBe('web-locks')
  })
  it('notifies same-tab subscribers and removes listeners on cleanup/StrictMode remount', async () => {
    const storage = memoryStorage(); const a = createInventoryStore({ storage, eventTarget: window }); const b = createInventoryStore({ storage, eventTarget: window })
    const callback = vi.fn(); const cleanup = b.subscribe(callback)
    await a.write(syntheticProfile(), null)
    expect(callback).toHaveBeenCalledTimes(1)
    cleanup()
    window.dispatchEvent(new StorageEvent('storage', { key: INVENTORY_STORAGE_KEY }))
    expect(callback).toHaveBeenCalledTimes(1)
    b.subscribe(callback)
    window.dispatchEvent(new StorageEvent('storage', { key: 'other' }))
    expect(callback).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new StorageEvent('storage', { key: INVENTORY_STORAGE_KEY }))
    expect(callback).toHaveBeenCalledTimes(2)
    b.dispose()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
    expect(callback).toHaveBeenCalledTimes(2)
  })
})

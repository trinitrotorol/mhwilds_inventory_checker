import { useEffect, useRef, useState } from 'react'
import { normalizeProfile } from '../domain'
import { createInventoryStore } from '../storage'
import type { InventoryProfile } from '../domain'

export type InventoryStore = ReturnType<typeof createInventoryStore>
type SaveState = 'saved' | 'saving' | 'unsaved' | 'conflict'

export function useInventory(store: InventoryStore) {
  const [loaded, setLoaded] = useState(() => store.read())
  const [profile, setProfile] = useState(loaded.profile)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const state = useRef({ profile: loaded.profile, raw: loaded.raw, pending: 0, blocked: false, revision: 0, queue: Promise.resolve() })
  useEffect(() => store.subscribe(() => {
    if (state.current.pending || state.current.blocked) return
    const next = store.read()
    if (next.raw === state.current.raw) return
    state.current.profile = next.profile
    state.current.raw = next.raw
    state.current.revision += 1
    setRevision(state.current.revision)
    setLoaded(next)
    setProfile(next.profile)
    setError('別のタブの変更を読み込みました。編集中の護石や取込プレビューは再確認してください。')
  }), [store])

  function update(change: (current: InventoryProfile | null) => InventoryProfile, expectedRevision?: number, recovery = false) {
    const current = state.current
    if (current.blocked || (expectedRevision !== undefined && expectedRevision !== current.revision)) {
      setError('保存内容が変更されています。編集中の内容を確認し、最新の保存データを読み込んでからやり直してください。')
      return false
    }
    let next: InventoryProfile
    try { next = normalizeProfile({ ...change(current.profile), updated_at: new Date().toISOString() }) }
    catch { setError('入力内容を保存できません。値の範囲や重複を確認してください。'); return false }
    current.profile = next
    current.revision += 1
    current.pending += 1
    setRevision(current.revision)
    setProfile(next)
    setSaveState('saving')
    setError('')
    current.queue = current.queue.then(async () => {
      if (current.blocked) { current.pending -= 1; return }
      const result = await (recovery ? store.recover(next, current.raw) : store.write(next, current.raw))
      current.pending -= 1
      if (result.status === 'saved') {
        current.raw = result.raw
        setLoaded(store.read())
        if (!current.pending) {
          current.profile = result.profile
          setProfile(result.profile)
          setSaveState('saved')
        }
      } else {
        current.blocked = true
        setSaveState(result.status === 'conflict' ? 'conflict' : 'unsaved')
        setError(result.status === 'conflict' ? '別のタブと保存が競合しました。この画面の変更は未保存です。JSONを退避してから最新の保存データを読み込んでください。' : '保存できませんでした。この画面の変更は未保存です。JSONをダウンロードして退避してください。')
      }
    }).catch(() => {
      current.pending = Math.max(0, current.pending - 1)
      current.blocked = true
      setSaveState('unsaved')
      setError('保存できませんでした。JSONをダウンロードして退避してください。')
    })
    return true
  }
  function reload() {
    if (state.current.pending) return
    const next = store.read()
    state.current.profile = next.profile
    state.current.raw = next.raw
    state.current.blocked = false
    state.current.revision += 1
    setRevision(state.current.revision)
    setLoaded(next)
    setProfile(next.profile)
    setSaveState('saved')
    setError('')
  }
  return { loaded, profile, saveState, error, revision, update, reload }
}

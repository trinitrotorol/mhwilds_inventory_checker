import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { exportProfile } from './domain'
import { createInventoryStore, INVENTORY_STORAGE_KEY } from './storage'
import { syntheticCatalog, syntheticProfile } from './test/domain-fixtures'

function setup(seed = true) {
  if (seed) localStorage.setItem(INVENTORY_STORAGE_KEY, exportProfile(syntheticProfile()))
  const store = createInventoryStore({ storage: localStorage, locks: null })
  const loader = { load: vi.fn(async () => ({ status: 'ready' as const, catalog: syntheticCatalog() })), dispose: vi.fn() }
  const view = render(<App store={store} catalogLoader={loader} />)
  return { store, loader, ...view }
}
async function loaded() { await screen.findByRole('heading', { name: '試験攻撃珠' }) }
async function saved() { await waitFor(() => expect(screen.getByText('このブラウザに保存済み')).toBeInTheDocument()) }
function backupFile(raw: string) {
  const file = new File([raw], 'backup.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: async () => raw })
  return file
}

beforeEach(() => { localStorage.clear() })

describe('Inventory checker', () => {
  it('saves rapid quantity updates in order and restores the same profile on reload', async () => {
    const { store, loader, unmount } = setup()
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: '試験攻撃珠を1個増やす' }))
    fireEvent.click(screen.getByRole('button', { name: '試験攻撃珠を1個増やす' }))
    await saved()
    expect(store.read().profile?.decorations[0]?.quantity).toBe(4)
    expect(store.read().profile?.fixed_charms[0]?.quantity).toBe(3)
    unmount()
    render(<App store={store} catalogLoader={loader} />)
    await loaded()
    expect(screen.getByRole('textbox', { name: '試験攻撃珠の所持数' })).toHaveValue('4')
    expect(screen.getByRole('link', { name: /スキルシミュレーター/ })).toHaveAttribute('href', '/game-guide/mhwilds-skill-sim/')
  })

  it('filters name, ID, skill, ownership, slot and kind with a null-name fallback', async () => {
    setup()
    await loaded()
    fireEvent.change(screen.getByRole('searchbox', { name: '名称・ID・スキルで検索' }), { target: { value: '試験防御' } })
    expect(screen.getByRole('heading', { name: 'test:defense-jewel' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '試験攻撃珠' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('所持状態'), { target: { value: 'owned' } })
    expect(screen.getByText(/条件に一致する装飾品はありません/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('所持状態'), { target: { value: 'missing' } })
    fireEvent.change(screen.getByLabelText('装飾品の種類'), { target: { value: 'armor' } })
    fireEvent.change(screen.getByLabelText('スロットレベル'), { target: { value: '2' } })
    expect(screen.getByRole('heading', { name: 'test:defense-jewel' })).toBeInTheDocument()
  })

  it('preserves fixed charm quantity greater than one and other categories', async () => {
    const { store } = setup()
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: '固定護石' }))
    const input = screen.getByRole('textbox', { name: '試験護石の所持数' })
    expect(input).toHaveValue('3')
    fireEvent.change(input, { target: { value: '7' } })
    fireEvent.blur(input)
    await saved()
    expect(store.read().profile?.fixed_charms[0]?.quantity).toBe(7)
    expect(store.read().profile?.decorations).toEqual(syntheticProfile().decorations)
    expect(store.read().profile?.appraisal_charms).toEqual(syntheticProfile().appraisal_charms)
  })

  it.each([
    { category: '装飾品', name: '試験攻撃珠', kind: 'decorations' as const },
    { category: '固定護石', name: '試験護石', kind: 'fixed_charms' as const },
  ])('preserves a newer external $category quantity while retaining the dirty input', async ({ category, name, kind }) => {
    const { store } = setup()
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: category }))
    const input = screen.getByRole('textbox', { name: `${name}の所持数` })
    act(() => input.focus())
    fireEvent.change(input, { target: { value: '8' } })
    const external = syntheticProfile()
    external[kind][0]!.quantity = 5
    const raw = exportProfile(external)
    // The storage event updates the hook's CAS base before the dirty editor
    // rerenders. Blurring within this turn must still use the edit-start revision.
    act(() => {
      const oldValue = localStorage.getItem(INVENTORY_STORAGE_KEY)
      localStorage.setItem(INVENTORY_STORAGE_KEY, raw)
      window.dispatchEvent(new StorageEvent('storage', { key: INVENTORY_STORAGE_KEY, oldValue, newValue: raw, storageArea: localStorage }))
      fireEvent.blur(input)
    })
    expect(store.read().raw).toBe(raw)
    expect(store.read().profile?.[kind][0]?.quantity).toBe(5)
    expect(input).toHaveValue('8')
    expect(screen.getByText(/最新の保存値は5個/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `${name}を1個増やす` })).toBeDisabled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(store.read().raw).toBe(raw)
    fireEvent.click(screen.getByRole('button', { name: `${name}の入力を最新の保存値に戻す` }))
    expect(input).toHaveValue('5')
    fireEvent.change(input, { target: { value: '6' } })
    fireEvent.blur(input)
    await saved()
    expect(store.read().profile?.[kind][0]?.quantity).toBe(6)
    expect(store.read().profile?.appraisal_charms).toEqual(external.appraisal_charms)
  })

  it('creates a pattern-valid appraisal and edits, clones, cancels deletion and deletes it', async () => {
    const { store } = setup()
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: '鑑定護石' }))
    fireEvent.click(screen.getByRole('button', { name: '＋ 鑑定護石を登録' }))
    expect(screen.getByRole('button', { name: 'この護石を保存' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('ルールから入力を開始'), { target: { value: 'test:pattern' } })
    fireEvent.change(screen.getByLabelText('表示ラベル（任意）'), { target: { value: '新しい護石' } })
    expect(screen.getByText(/2件のパターンに一致/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'この護石を保存' }))
    await saved()
    expect(store.read().profile?.appraisal_charms).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '新しい護石を編集' }))
    fireEvent.change(screen.getByLabelText('表示ラベル（任意）'), { target: { value: '編集した護石' } })
    fireEvent.click(screen.getByRole('button', { name: 'この護石を保存' }))
    await saved()
    fireEvent.click(screen.getByRole('button', { name: '編集した護石を複製' }))
    fireEvent.change(screen.getByLabelText('表示ラベル（任意）'), { target: { value: '複製した護石' } })
    fireEvent.click(screen.getByRole('button', { name: 'この護石を保存' }))
    await saved()
    expect(store.read().profile?.appraisal_charms).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: '複製した護石を削除' }))
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(store.read().profile?.appraisal_charms).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: '複製した護石を削除' }))
    fireEvent.click(screen.getByRole('button', { name: 'この鑑定護石を削除' }))
    await saved()
    expect(store.read().profile?.appraisal_charms).toHaveLength(2)
    expect(store.read().profile?.decorations).toEqual(syntheticProfile().decorations)
  })

  it('does not mutate on import cancel and invalidates stale previews', async () => {
    const { store } = setup()
    await loaded()
    const initialRaw = store.read().raw
    const imported = syntheticProfile()
    imported.decorations[0]!.quantity = 10
    const upload = screen.getByLabelText('復元するJSONファイル')
    fireEvent.change(upload, { target: { files: [backupFile(exportProfile(imported))] } })
    await screen.findByRole('dialog', { name: 'バックアップの取込確認' })
    expect(store.read().raw).toBe(initialRaw)
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(store.read().raw).toBe(initialRaw)
    fireEvent.change(upload, { target: { files: [backupFile(exportProfile(imported))] } })
    await screen.findByRole('dialog', { name: 'バックアップの取込確認' })
    await act(async () => {
      const external = syntheticProfile()
      external.fixed_charms[0]!.quantity = 5
      await store.write(external, store.read().raw)
    })
    expect(screen.getByRole('button', { name: '統合して保存' })).toBeDisabled()
    expect(screen.getByText(/プレビュー後に所持情報が更新/)).toBeInTheDocument()
  })

  it('merges with max quantities and allows explicit replacement', async () => {
    const { store } = setup()
    await loaded()
    const imported = syntheticProfile()
    imported.decorations[0]!.quantity = 10
    imported.fixed_charms = []
    const upload = screen.getByLabelText('復元するJSONファイル')
    fireEvent.change(upload, { target: { files: [backupFile(exportProfile(imported))] } })
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: '統合して保存' }))
    await saved()
    expect(store.read().profile?.decorations[0]?.quantity).toBe(10)
    expect(store.read().profile?.fixed_charms[0]?.quantity).toBe(3)
    fireEvent.change(upload, { target: { files: [backupFile(exportProfile(imported))] } })
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('radio', { name: 'バックアップで全体を置換' }))
    fireEvent.click(screen.getByRole('button', { name: '全体を置換して保存' }))
    await saved()
    expect(store.read().profile?.fixed_charms).toEqual([])
  })

  it('keeps corrupt raw through cancel and protects it on confirmed reset', async () => {
    localStorage.setItem(INVENTORY_STORAGE_KEY, '{broken')
    const { store } = setup(false)
    await loaded()
    expect(screen.getByRole('button', { name: '試験攻撃珠を1個増やす' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '元の保存データを退避' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '所持情報を初期化' }))
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(store.read().raw).toBe('{broken')
    fireEvent.click(screen.getByRole('button', { name: '所持情報を初期化' }))
    fireEvent.click(screen.getByRole('button', { name: '登録をすべて初期化' }))
    await saved()
    expect(store.read().status).toBe('ready')
    expect(Object.keys(localStorage).some((key) => key.startsWith(`${INVENTORY_STORAGE_KEY}.recovery.`) && localStorage.getItem(key) === '{broken')).toBe(true)
  })

  it('retains the draft and offers a backup when quota prevents saving', async () => {
    const data = exportProfile(syntheticProfile())
    const store = createInventoryStore({ storage: { getItem: () => data, setItem: () => { throw new DOMException('full', 'QuotaExceededError') } }, locks: null })
    render(<App store={store} catalogLoader={{ load: async () => ({ status: 'ready', catalog: syntheticCatalog() }), dispose: () => undefined }} />)
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: '試験攻撃珠を1個増やす' }))
    await screen.findByText('未保存の変更あり')
    expect(screen.getByRole('textbox', { name: '試験攻撃珠の所持数' })).toHaveValue('3')
    expect(screen.getByRole('button', { name: 'JSONをダウンロード' })).toBeEnabled()
    expect(store.read().profile?.decorations[0]?.quantity).toBe(2)
  })

  it('blocks stale appraisal drafts after another tab saves and preserves both categories', async () => {
    const { store } = setup()
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: '鑑定護石' }))
    fireEvent.click(screen.getByRole('button', { name: '個人用ラベルを編集' }))
    await act(async () => {
      const external = syntheticProfile()
      external.decorations[0]!.quantity = 6
      await store.write(external, store.read().raw)
    })
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'この護石を保存' })).toBeDisabled()
    expect(screen.getByText(/編集中に所持情報が更新/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(store.read().profile?.decorations[0]?.quantity).toBe(6)
    expect(store.read().profile?.appraisal_charms).toEqual(syntheticProfile().appraisal_charms)
  })

  it('never substitutes fixtures or initializes storage after a catalog failure', async () => {
    const store = createInventoryStore({ storage: localStorage, locks: null })
    render(<App store={store} catalogLoader={{ load: async () => ({ status: 'error', catalog: null }), dispose: () => undefined }} />)
    await screen.findByRole('heading', { name: 'カタログを取得できませんでした' })
    expect(screen.queryByRole('heading', { name: '試験攻撃珠' })).not.toBeInTheDocument()
    expect(store.read().status).toBe('empty')
  })
})

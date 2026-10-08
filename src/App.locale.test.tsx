import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { exportProfile } from './domain'
import { createInventoryStore, INVENTORY_STORAGE_KEY } from './storage'
import { LOCALE_EVENT, LOCALE_STORAGE_KEY } from './i18n/locale'
import type { EnglishNames } from './i18n/names'
import { syntheticCatalog, syntheticProfile } from './test/domain-fixtures'
import * as download from './ui/download'

const englishNames: EnglishNames = { schema_version: 1, locale: 'en', names: { skills: { 'test:attack': 'Test Attack', 'test:defense': 'Test Defense' }, equipment: { 'test:fixed-charm': 'Test Charm' }, decorations: { 'test:attack-jewel': 'Test Attack Jewel', 'test:defense-jewel': 'Test Defense Jewel' } } }
function setup(namesLoader = vi.fn(async () => englishNames)) {
  localStorage.setItem(INVENTORY_STORAGE_KEY, exportProfile(syntheticProfile()))
  const store = createInventoryStore({ storage: localStorage, locks: null })
  const catalogLoader = { load: vi.fn(async () => ({ status: 'ready' as const, catalog: syntheticCatalog() })), dispose: vi.fn() }
  const view = render(<App store={store} catalogLoader={catalogLoader} namesLoader={namesLoader} />)
  return { store, namesLoader, ...view }
}
const language = () => screen.getByRole('combobox', { name: '言語 / Language' })
const selectEnglish = () => fireEvent.change(language(), { target: { value: 'en' } })
beforeEach(() => { localStorage.clear(); history.replaceState(null, '', '/') })
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); document.querySelector('title')?.removeAttribute('data-service-text-ja') })

describe('inventory language setting', () => {
  it('defaults to Japanese and switches both UI and names without rewriting inventory', async () => {
    const { namesLoader, unmount, store } = setup()
    await screen.findByRole('heading', { name: '試験攻撃珠' })
    const original = localStorage.getItem(INVENTORY_STORAGE_KEY)
    expect(language()).toHaveValue('ja'); expect(namesLoader).not.toHaveBeenCalled()
    const changed = vi.fn(); window.addEventListener(LOCALE_EVENT, changed)
    selectEnglish()
    await screen.findByRole('heading', { name: 'Test Attack Jewel' })
    expect(document.documentElement.lang).toBe('en'); expect(document.title).toBe('MHWILDS Inventory Checker')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    expect(changed.mock.calls[0]?.[0].detail).toBe('en')
    expect(screen.getByRole('button', { name: 'Download JSON' })).toBeEnabled()
    expect(screen.getByRole('textbox', { name: 'Quantity owned: Test Attack Jewel' })).toHaveValue('2')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search by name, ID or skill' }), { target: { value: 'test:attack-jewel' } })
    expect(screen.getByRole('heading', { name: 'Test Attack Jewel' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search by name, ID or skill' }), { target: { value: 'Test Attack' } })
    expect(screen.getByRole('heading', { name: 'Test Attack Jewel' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search by name, ID or skill' }), { target: { value: '' } })
    fireEvent.change(language(), { target: { value: 'ja' } })
    await screen.findByRole('heading', { name: '試験攻撃珠' })
    expect(localStorage.getItem(INVENTORY_STORAGE_KEY)).toBe(original)
    expect(store.read().profile?.appraisal_charms[0]?.label).toBe('個人用ラベル')
    expect(document.documentElement.lang).toBe('ja')
    selectEnglish(); unmount()
    setup()
    await screen.findByRole('heading', { name: 'Test Attack Jewel' })
    expect(language()).toHaveValue('en')
    window.removeEventListener(LOCALE_EVENT, changed)
  })

  it('edits quantities in English and preserves stable IDs when switching back', async () => {
    const { store } = setup(); selectEnglish()
    await screen.findByRole('heading', { name: 'Test Attack Jewel' })
    fireEvent.click(screen.getByRole('button', { name: 'Increase Test Attack Jewel by 1' }))
    await waitFor(() => expect(store.read().profile?.decorations[0]?.quantity).toBe(3))
    fireEvent.change(language(), { target: { value: 'ja' } })
    expect(screen.getByRole('textbox', { name: '試験攻撃珠の所持数' })).toHaveValue('3')
    expect(store.read().profile?.decorations).toEqual([{ decoration_id: 'test:attack-jewel', quantity: 3 }])
  })

  it.each([
    ['装飾品', '試験攻撃珠', 'Test Attack Jewel'],
    ['固定護石', '試験護石', 'Test Charm'],
  ])('keeps an invalid filtered %s quantity draft across language changes', async (category, japaneseName, englishName) => {
    setup(); await screen.findByRole('heading', { name: '試験攻撃珠' })
    fireEvent.click(screen.getByRole('button', { name: category }))
    fireEvent.change(screen.getByRole('searchbox', { name: '名称・ID・スキルで検索' }), { target: { value: japaneseName } })
    const input = screen.getByRole('textbox', { name: `${japaneseName}の所持数` })
    const before = localStorage.getItem(INVENTORY_STORAGE_KEY)
    fireEvent.change(input, { target: { value: '1.5' } }); fireEvent.blur(input)
    selectEnglish(); await screen.findByRole('heading', { name: englishName })
    expect(screen.getByRole('textbox', { name: `Quantity owned: ${englishName}` })).toBe(input)
    expect(input).toHaveValue('1.5'); expect(input).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search by name, ID or skill' }), { target: { value: englishName } })
    fireEvent.change(language(), { target: { value: 'ja' } })
    expect(screen.getByRole('textbox', { name: `${japaneseName}の所持数` })).toBe(input)
    expect(input).toHaveValue('1.5')
    expect(localStorage.getItem(INVENTORY_STORAGE_KEY)).toBe(before)
  })

  it('retains an uncommitted valid quantity draft when another tab changes the language', async () => {
    setup(); await screen.findByRole('heading', { name: '試験攻撃珠' })
    fireEvent.change(screen.getByRole('searchbox', { name: '名称・ID・スキルで検索' }), { target: { value: '試験攻撃珠' } })
    const input = screen.getByRole('textbox', { name: '試験攻撃珠の所持数' })
    const before = localStorage.getItem(INVENTORY_STORAGE_KEY)
    fireEvent.change(input, { target: { value: '8' } })
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'en' })))
    await screen.findByRole('heading', { name: 'Test Attack Jewel' })
    expect(screen.getByRole('textbox', { name: 'Quantity owned: Test Attack Jewel' })).toBe(input)
    expect(input).toHaveValue('8')
    expect(localStorage.getItem(INVENTORY_STORAGE_KEY)).toBe(before)
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'ja' })))
    expect(screen.getByRole('textbox', { name: '試験攻撃珠の所持数' })).toBe(input)
    expect(input).toHaveValue('8')
  })

  it('localizes appraisal validation, import preview and export while retaining user labels', async () => {
    const { store } = setup(); selectEnglish()
    await screen.findByRole('heading', { name: 'Test Attack Jewel' })
    fireEvent.click(screen.getByRole('button', { name: 'Appraisal charms' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit 個人用ラベル' }))
    const editor = screen.getByRole('dialog', { name: 'Edit appraisal charm' })
    expect(within(editor).getByLabelText('Display label (optional)')).toHaveValue('個人用ラベル')
    expect(within(editor).getAllByRole('option', { name: 'Test Attack' })).toHaveLength(2)
    fireEvent.change(within(editor).getByLabelText('Quantity owned'), { target: { value: '1.5' } })
    expect(within(editor).getByText('Enter a whole number from 1 to 9,007,199,254,740,991.')).toBeInTheDocument()
    expect(within(editor).getByRole('button', { name: 'Save this charm' })).toBeDisabled()
    fireEvent.click(within(editor).getByRole('button', { name: 'Cancel' }))
    const raw = exportProfile(syntheticProfile())
    const file = new File([raw], 'backup.json', { type: 'application/json' }); Object.defineProperty(file, 'text', { value: async () => raw })
    fireEvent.change(screen.getByLabelText('JSON backup to restore'), { target: { files: [file] } })
    const preview = await screen.findByRole('dialog', { name: 'Confirm backup import' })
    expect(within(preview).getByRole('radio', { name: 'Merge with current inventory' })).toBeChecked()
    fireEvent.click(within(preview).getByRole('button', { name: 'Merge and save' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const save = vi.spyOn(download, 'downloadText').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }))
    expect(JSON.parse(save.mock.calls[0]![0]).appraisal_charms[0].label).toBe('個人用ラベル')
    expect(store.read().profile?.profile_id).toBe('test:profile')
  })

  it('falls back to original names on a sidecar failure without blocking inventory', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    setup(vi.fn(async () => { throw new Error('offline') }))
    await screen.findByText('Translated names could not be loaded. Original names are shown.')
    expect(screen.getByRole('heading', { name: '試験攻撃珠' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download JSON' })).toBeEnabled()
  })

  it('accepts valid cross-tab language updates and ignores invalid custom events', async () => {
    setup(); await screen.findByRole('heading', { name: '試験攻撃珠' })
    const before = localStorage.getItem(INVENTORY_STORAGE_KEY)
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'en' })))
    await screen.findByRole('heading', { name: 'Test Attack Jewel' })
    act(() => window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: '<script>' })))
    expect(language()).toHaveValue('en')
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: null })))
    expect(language()).toHaveValue('ja')
    expect(localStorage.getItem(INVENTORY_STORAGE_KEY)).toBe(before)
  })

  it('keeps the static service title and uses original names when the sidecar times out', async () => {
    document.title = 'Service-owned title'
    document.querySelector('title')!.setAttribute('data-service-text-ja', 'サイトのタイトル')
    setup(vi.fn(() => new Promise<EnglishNames>(() => {})))
    await screen.findByRole('heading', { name: '試験攻撃珠' })
    vi.useFakeTimers(); selectEnglish()
    await act(() => vi.advanceTimersByTimeAsync(15_000))
    expect(screen.getByText('Translated names could not be loaded. Original names are shown.')).toBeInTheDocument()
    expect(document.title).toBe('Service-owned title')
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByRole('button', { name: 'Download JSON' })).toBeEnabled()
  })
})

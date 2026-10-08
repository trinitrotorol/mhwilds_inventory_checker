// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOCALE_STORAGE_KEY, readLocale } from './locale'

afterEach(() => vi.unstubAllGlobals())
describe('language preference', () => {
  it.each([null, '', 'fr', 'EN', '<script>'])('keeps Japanese for an absent or invalid preference %s', (value) => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => value) })
    expect(readLocale()).toBe('ja')
  })
  it('reads only the dedicated language key and tolerates storage denial', () => {
    const getItem = vi.fn(() => 'en'); vi.stubGlobal('localStorage', { getItem })
    expect(readLocale()).toBe('en'); expect(getItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY)
    getItem.mockImplementation(() => { throw new Error('storage denied') })
    expect(readLocale()).toBe('ja')
  })
})

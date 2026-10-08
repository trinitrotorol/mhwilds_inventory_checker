export type Locale = 'ja' | 'en'
export const LOCALE_STORAGE_KEY = 'mhwilds.ui.locale.v1'
export const LOCALE_EVENT = 'mhwilds:locale-change'
export function isLocale(value: unknown): value is Locale { return value === 'ja' || value === 'en' }
export function readLocale(): Locale {
  try { const value = localStorage.getItem(LOCALE_STORAGE_KEY); return isLocale(value) ? value : 'ja' } catch { return 'ja' }
}

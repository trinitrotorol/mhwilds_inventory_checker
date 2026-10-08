import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LocaleContext } from './context'
import { isLocale, LOCALE_EVENT, LOCALE_STORAGE_KEY, readLocale } from './locale'
import type { Locale } from './locale'
import { translate } from './messages'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState(readLocale)
  const setLocale = useCallback((next: Locale) => {
    updateLocale(next)
    try { localStorage.setItem(LOCALE_STORAGE_KEY, next) } catch { /* The selection still works when storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: next }))
  }, [])
  useEffect(() => {
    const storage = (event: StorageEvent) => { if (event.key === LOCALE_STORAGE_KEY || event.key === null) updateLocale(isLocale(event.newValue) ? event.newValue : 'ja') }
    const changed = (event: Event) => { if (event instanceof CustomEvent && isLocale(event.detail)) updateLocale(event.detail) }
    window.addEventListener('storage', storage)
    window.addEventListener(LOCALE_EVENT, changed)
    return () => { window.removeEventListener('storage', storage); window.removeEventListener(LOCALE_EVENT, changed) }
  }, [])
  useEffect(() => {
    document.documentElement.lang = locale
    if (!document.querySelector('title[data-service-text-ja]')) document.title = locale === 'en' ? 'MHWILDS Inventory Checker' : 'MHWILDS 所持品チェッカー'
  }, [locale])
  const value = useMemo(() => ({ locale, setLocale, t: (message: string, ...values: (string | number)[]) => translate(locale, message, ...values) }), [locale, setLocale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

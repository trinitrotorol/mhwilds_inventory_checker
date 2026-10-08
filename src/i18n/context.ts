import { createContext, useContext } from 'react'
import type { Locale } from './locale'
import { translate } from './messages'

export const LocaleContext = createContext({ locale: 'ja' as Locale, setLocale: (locale: Locale) => { void locale }, t: (message: string, ...values: (string | number)[]) => translate('ja', message, ...values) })
export function useLocale() { return useContext(LocaleContext) }

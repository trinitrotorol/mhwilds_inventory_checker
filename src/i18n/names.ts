import type { CheckerCatalog } from '../domain'
import { resolveSimBasePath } from '../../config/basePath'

export interface EnglishNames { schema_version: 1; locale: 'en'; names: { skills: Record<string, string>; equipment: Record<string, string>; decorations: Record<string, string> } }
const MAX_NAMES_BYTES = 4 * 1024 * 1024
export function parseEnglishNames(value: unknown): EnglishNames {
  if (!value || typeof value !== 'object' || !('schema_version' in value) || value.schema_version !== 1 || !('locale' in value) || value.locale !== 'en' || !('names' in value) || !value.names || typeof value.names !== 'object') throw new Error('Invalid language data')
  const names = { skills: {}, equipment: {}, decorations: {} } as EnglishNames['names']
  for (const category of ['skills', 'equipment', 'decorations'] as const) {
    const entries: unknown = Reflect.get(value.names, category)
    if (!entries || typeof entries !== 'object' || Array.isArray(entries) || Object.keys(entries).length > 20_000) throw new Error('Invalid language names')
    for (const [id, name] of Object.entries(entries)) {
      if (!id || id.length > 512 || typeof name !== 'string' || !name.trim() || name.length > 512) throw new Error('Invalid translated name')
    }
    names[category] = Object.fromEntries(Object.entries(entries)) as Record<string, string>
  }
  return { schema_version: 1, locale: 'en', names }
}
export async function loadEnglishNames(signal: AbortSignal, fetcher: typeof fetch = globalThis.fetch, origin = globalThis.location?.origin): Promise<EnglishNames> {
  if (!origin) throw new Error('Origin unavailable')
  const base = new URL(origin)
  const url = new URL(resolveSimBasePath(import.meta.env.VITE_SIM_BASE_PATH) + 'locales/en.json', base)
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin) throw new Error('Language data must be same-origin')
  const response = await fetcher(url.href, { signal, credentials: 'omit', redirect: 'error', cache: 'no-cache', headers: { Accept: 'application/json' } })
  if (response.status !== 200 || response.redirected || (response.url && new URL(response.url).origin !== base.origin) || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) throw new Error('Language data unavailable')
  const length = response.headers.get('content-length')
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_NAMES_BYTES)) throw new Error('Language data too large')
  let raw = ''
  if (response.body) {
    const reader = response.body.getReader(); const decoder = new TextDecoder('utf-8', { fatal: true }); let bytes = 0
    try {
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        bytes += chunk.value.byteLength
        if (bytes > MAX_NAMES_BYTES || signal.aborted) { await reader.cancel(); throw new Error('Language data aborted or too large') }
        raw += decoder.decode(chunk.value, { stream: true })
      }
      raw += decoder.decode()
    } finally { reader.releaseLock() }
  } else raw = await response.text()
  if (new TextEncoder().encode(raw).length > MAX_NAMES_BYTES || signal.aborted) throw new Error('Language data aborted or too large')
  return parseEnglishNames(JSON.parse(raw))
}
export function localizeCatalog(catalog: CheckerCatalog, names: EnglishNames | null): CheckerCatalog {
  if (!names) return catalog
  const name = (values: Record<string, string>, id: string, fallback: string | null) => Object.hasOwn(values, id) ? values[id]! : fallback
  return { ...catalog,
    skills: catalog.skills.map((entry) => ({ ...entry, display_name: name(names.names.skills, entry.skill_id, entry.display_name) })),
    decorations: catalog.decorations.map((entry) => ({ ...entry, display_name: name(names.names.decorations, entry.decoration_id, entry.display_name) })),
    fixed_charms: catalog.fixed_charms.map((entry) => ({ ...entry, display_name: name(names.names.equipment, entry.equipment_id, entry.display_name) })),
  }
}

import { MAX_CATALOG_BYTES, parseBoundedJson, parseCatalog } from '../domain'
import type { CheckerCatalog } from '../domain'

export const DEFAULT_CATALOG_URL = '/game-guide/mhwilds-skill-sim/catalog/checker-catalog.json'
export interface CatalogLoadResult {
  status: 'ready' | 'stale' | 'error' | 'aborted'
  catalog: CheckerCatalog | null
  error?: string
}
export interface CatalogLoaderOptions {
  url?: string
  origin?: string
  fetch?: typeof fetch
  timeoutMs?: number
  maxBytes?: number
}
export function createCatalogLoader(options: CatalogLoaderOptions = {}) {
  const fetcher = options.fetch ?? globalThis.fetch
  const origin = options.origin ?? globalThis.location?.origin
  let cached: CheckerCatalog | null = null
  let active: AbortController | undefined
  let sequence = 0
  async function load(signal?: AbortSignal): Promise<CatalogLoadResult> {
    const requestId = ++sequence
    active?.abort()
    const controller = new AbortController()
    active = controller
    let timedOut = false
    const abort = () => controller.abort()
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) controller.abort()
    const timeout = setTimeout(() => { timedOut = true; controller.abort() }, options.timeoutMs ?? 15_000)
    try {
      if (!origin) throw new Error('カタログの同一オリジンを確認できません。')
      const base = new URL(origin)
      const url = new URL(options.url ?? DEFAULT_CATALOG_URL, base)
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin || url.username || url.password || url.hash) throw new Error('同一オリジンのカタログURLのみ利用できます。')
      const response = await fetcher(url.href, { signal: controller.signal, credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' }, cache: 'no-cache' })
      if (controller.signal.aborted || requestId !== sequence) throw new Error('aborted')
      if (!response.ok || response.status !== 200) throw new Error(`カタログ取得に失敗しました（HTTP ${response.status}）。`)
      if (response.redirected || (response.url && new URL(response.url).origin !== base.origin)) throw new Error('カタログの転送先を拒否しました。')
      if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) throw new Error('カタログの形式がJSONではありません。')
      const maxBytes = options.maxBytes ?? MAX_CATALOG_BYTES
      const contentLength = response.headers.get('content-length')
      if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) throw new Error('カタログが安全上のサイズ上限を超えています。')
      let raw = ''
      if (response.body) {
        const reader = response.body.getReader(); const decoder = new TextDecoder('utf-8', { fatal: true }); let bytes = 0
        try {
          while (true) {
            const chunk = await reader.read()
            if (chunk.done) break
            bytes += chunk.value.byteLength
            if (bytes > maxBytes) { await reader.cancel(); throw new Error('カタログが安全上のサイズ上限を超えています。') }
            if (controller.signal.aborted) { await reader.cancel(); throw new Error('aborted') }
            raw += decoder.decode(chunk.value, { stream: true })
          }
          raw += decoder.decode()
        } finally { reader.releaseLock() }
      } else raw = await response.text()
      const catalog = parseCatalog(parseBoundedJson(raw, maxBytes))
      if (controller.signal.aborted || requestId !== sequence) throw new Error('aborted')
      cached = catalog
      return { status: 'ready', catalog }
    } catch (error) {
      if (requestId !== sequence || (controller.signal.aborted && !timedOut)) return { status: 'aborted', catalog: cached }
      return { status: cached ? 'stale' : 'error', catalog: cached, error: timedOut ? 'カタログの取得がタイムアウトしました。' : error instanceof Error ? error.message : 'カタログを取得できません。' }
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); if (requestId === sequence) active = undefined }
  }
  return { load, dispose: () => { sequence++; active?.abort(); active = undefined } }
}

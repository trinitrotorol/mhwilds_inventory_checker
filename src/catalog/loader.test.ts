// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCatalogLoader } from './index'
import { syntheticCatalog } from '../test/domain-fixtures'

const response = (value: unknown = syntheticCatalog(), status = 200, headers: Record<string, string> = { 'content-type': 'application/json' }) => new Response(JSON.stringify(value), { status, headers })
const origin = 'https://test.example'
afterEach(() => vi.useRealTimers())

describe('production catalog loader', () => {
  it('loads strictly validated nonempty real data and sends no credentials', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response())
    const loader = createCatalogLoader({ origin, fetch: fetcher })
    expect(await loader.load()).toEqual({ status: 'ready', catalog: syntheticCatalog() })
    expect(fetcher).toHaveBeenCalledWith('https://test.example/game-guide/mhwilds-skill-sim/catalog/checker-catalog.json', expect.objectContaining({ credentials: 'omit', redirect: 'error', cache: 'no-cache' }))
  })
  it.each(['https://other.example/data.json', 'https://user:pass@test.example/data.json', 'javascript:alert(1)', '/data.json#fragment'])('rejects unsafe URL %s before any network call', async (url) => {
    const fetcher = vi.fn<typeof fetch>()
    expect((await createCatalogLoader({ origin, url, fetch: fetcher }).load()).status).toBe('error')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('never replaces a good cache with invalid/empty/failed updates', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(response()).mockResolvedValueOnce(response({})).mockResolvedValueOnce(response(null, 503))
    const loader = createCatalogLoader({ origin, fetch: fetcher })
    await loader.load()
    expect(await loader.load()).toMatchObject({ status: 'stale', catalog: syntheticCatalog() })
    expect(await loader.load()).toMatchObject({ status: 'stale', catalog: syntheticCatalog() })
    const unavailable = createCatalogLoader({ origin, fetch: vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')) })
    expect(await unavailable.load()).toMatchObject({ status: 'error', catalog: null })
  })
  it('rejects wrong content type, bad JSON, oversize headers/body, redirects and missing references', async () => {
    const redirected = response(); Object.defineProperty(redirected, 'redirected', { value: true })
    const missing = syntheticCatalog(); missing.decorations[0]!.skills[0]!.skill_id = 'missing'
    const cases = [
      response({}, 200, { 'content-type': 'text/html' }),
      new Response('broken', { headers: { 'content-type': 'application/json' } }),
      response({}, 200, { 'content-type': 'application/json', 'content-length': '99999999999' }),
      response('x'.repeat(10_000)), redirected, response(missing),
    ]
    for (const result of cases) expect((await createCatalogLoader({ origin, fetch: vi.fn<typeof fetch>().mockResolvedValue(result), maxBytes: 5000 }).load()).status).toBe('error')
  })
  it('aborts replaced requests and ignores their late responses', async () => {
    let resolveOld: ((response: Response) => void) | undefined
    const old = new Promise<Response>((resolve) => { resolveOld = resolve })
    const next = { ...syntheticCatalog(), revision: 'latest' }
    const fetcher = vi.fn<typeof fetch>().mockReturnValueOnce(old).mockResolvedValueOnce(response(next))
    const loader = createCatalogLoader({ origin, fetch: fetcher })
    const first = loader.load(); const second = await loader.load()
    resolveOld!(response())
    expect((await first).status).toBe('aborted')
    expect(second.catalog?.revision).toBe('latest')
    expect(fetcher.mock.calls[0]![1]!.signal!.aborted).toBe(true)
  })
  it('distinguishes timeout from user cancellation and cleans listeners', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      const onAbort = () => reject(new DOMException('aborted', 'AbortError'))
      init?.signal?.addEventListener('abort', onAbort, { once: true })
      if (init?.signal?.aborted) onAbort()
    }))
    const loader = createCatalogLoader({ origin, fetch: fetcher, timeoutMs: 50 })
    const timed = loader.load()
    await vi.advanceTimersByTimeAsync(50)
    expect(await timed).toMatchObject({ status: 'error', error: expect.stringContaining('タイムアウト') })
    const controller = new AbortController(); const canceled = loader.load(controller.signal); controller.abort()
    expect((await canceled).status).toBe('aborted')
    const disposed = loader.load(); loader.dispose(); expect((await disposed).status).toBe('aborted')
    expect(vi.getTimerCount()).toBe(0)
  })
})

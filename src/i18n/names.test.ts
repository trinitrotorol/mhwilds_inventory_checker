// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadEnglishNames, localizeCatalog, parseEnglishNames } from './names'
import { syntheticCatalog } from '../test/domain-fixtures'

const names = { schema_version: 1, locale: 'en', names: { skills: { 'test:attack': 'Test Attack' }, equipment: { 'test:fixed-charm': 'Test Charm' }, decorations: { 'test:attack-jewel': 'Test Attack Jewel' } } }
afterEach(() => vi.unstubAllEnvs())
describe('English catalog names', () => {
  it('requests the configured simulator sidecar without credentials or redirects', async () => {
    vi.stubEnv('VITE_SIM_BASE_PATH', '/skill-sim/')
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(names), { headers: { 'content-type': 'application/json' } }))
    expect(await loadEnglishNames(new AbortController().signal, fetcher, 'https://mhwilds.example')).toEqual(names)
    expect(fetcher).toHaveBeenCalledWith('https://mhwilds.example/skill-sim/locales/en.json', expect.objectContaining({ credentials: 'omit', redirect: 'error', cache: 'no-cache' }))
  })
  it('changes only presentation names and falls back when a translation is absent', () => {
    const source = syntheticCatalog(); const before = JSON.stringify(source)
    const localized = localizeCatalog(source, parseEnglishNames(names))
    expect(localized.skills[0]?.display_name).toBe('Test Attack')
    expect(localized.decorations[0]?.display_name).toBe('Test Attack Jewel')
    expect(localized.fixed_charms[0]?.display_name).toBe('Test Charm')
    expect(localized.skills[1]).toEqual(source.skills[1])
    expect(localized.revision).toBe(source.revision)
    expect(localized.appraisal_charm_patterns).toBe(source.appraisal_charm_patterns)
    expect(JSON.stringify(source)).toBe(before)
    expect(localizeCatalog(source, null)).toBe(source)
  })
  it.each([null, { ...names, locale: 'ja' }, { ...names, schema_version: 2 }, { ...names, names: { ...names.names, skills: [] } }, { ...names, names: { ...names.names, skills: { id: 123 } } }])('rejects malformed names %#', (value) => {
    expect(() => parseEnglishNames(value)).toThrow()
  })
  it('rejects redirected, cross-origin, non-JSON and oversized responses', async () => {
    const redirected = new Response('{}', { headers: { 'content-type': 'application/json' } }); Object.defineProperty(redirected, 'redirected', { value: true })
    const external = new Response('{}', { headers: { 'content-type': 'application/json' } }); Object.defineProperty(external, 'url', { value: 'https://other.example/en.json' })
    const cases = [redirected, external, new Response('<html>'), new Response('{}', { headers: { 'content-type': 'application/json', 'content-length': '99999999' } })]
    for (const response of cases) await expect(loadEnglishNames(new AbortController().signal, vi.fn<typeof fetch>().mockResolvedValue(response), 'https://mhwilds.example')).rejects.toThrow()
  })
  it('rejects an unsafe route before any network request', async () => {
    vi.stubEnv('VITE_SIM_BASE_PATH', '//other.example/')
    const fetcher = vi.fn<typeof fetch>()
    await expect(loadEnglishNames(new AbortController().signal, fetcher, 'https://mhwilds.example')).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })
})

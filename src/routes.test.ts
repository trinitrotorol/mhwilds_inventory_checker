// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveBasePath } from '../config/basePath'
import { serviceRoutes } from './routes'

// Vitest serves modules at /; emulate the BASE_URL injected by a production build.
beforeEach(() => vi.stubEnv('BASE_URL', resolveBasePath()))
afterEach(() => vi.unstubAllEnvs())

describe('service deployment routes', () => {
  it('preserves the existing standalone paths by default', () => {
    expect(serviceRoutes('')).toEqual({
      checker: '/game-guide/mhwilds-inventory-checker/',
      simulator: '/game-guide/mhwilds-skill-sim/',
      catalog: '/game-guide/mhwilds-skill-sim/catalog/checker-catalog.json',
    })
  })

  it('uses Vite BASE_URL and the configured simulator path on the dedicated subdomain', () => {
    vi.stubEnv('BASE_URL', '/inventory/')
    vi.stubEnv('VITE_SIM_BASE_PATH', '/skill-sim/')
    expect(serviceRoutes('')).toEqual({
      checker: '/inventory/',
      simulator: '/skill-sim/',
      catalog: '/skill-sim/catalog/checker-catalog.json',
    })
  })

  it('keeps recovery navigation on the legacy site without propagating unrelated input', () => {
    expect(serviceRoutes('?unrelated=value&legacy=1')).toEqual({
      checker: '/game-guide/mhwilds-inventory-checker/?legacy=1',
      simulator: '/game-guide/mhwilds-skill-sim/?legacy=1',
      catalog: '/game-guide/mhwilds-skill-sim/catalog/checker-catalog.json',
    })
    expect(serviceRoutes('?legacy=0').simulator).toBe('/game-guide/mhwilds-skill-sim/')
  })

  it.each(['//other.example/', 'https://other.example/', '/path/?q=1', '/\\other.example/'])('rejects unsafe simulator route %s', (path) => {
    vi.stubEnv('VITE_SIM_BASE_PATH', path)
    expect(() => serviceRoutes('')).toThrow(/same-origin|start and end/)
  })
})

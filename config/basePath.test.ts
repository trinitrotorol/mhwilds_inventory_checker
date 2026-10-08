// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { DEFAULT_BASE_PATH, DEFAULT_SIM_BASE_PATH, resolveBasePath, resolveSimBasePath } from './basePath'

describe('resolveBasePath', () => {
  it('uses the planned public path by default', () => {
    expect(resolveBasePath()).toBe(DEFAULT_BASE_PATH)
    expect(DEFAULT_BASE_PATH).toBe('/game-guide/mhwilds-inventory-checker/')
  })

  it('accepts an explicit same-origin build path', () => {
    expect(resolveBasePath('/preview/inventory/')).toBe('/preview/inventory/')
  })

  it('keeps the standalone simulator default and accepts the subdomain route', () => {
    expect(resolveSimBasePath()).toBe(DEFAULT_SIM_BASE_PATH)
    expect(resolveSimBasePath('')).toBe('/game-guide/mhwilds-skill-sim/')
    expect(resolveSimBasePath('/skill-sim/')).toBe('/skill-sim/')
  })

  it.each([
    '/missing-trailing-slash',
    'missing-leading-slash/',
    '//example.test/app/',
    '/\\example.test/app/',
    '/app/?debug=1',
    '/app/#fragment/',
    '/app/\n/',
    'https://example.test/app/',
  ])(
    'rejects invalid override %s',
    (candidate) => {
      expect(() => resolveBasePath(candidate)).toThrow()
      expect(() => resolveSimBasePath(candidate)).toThrow(/VITE_SIM_BASE_PATH/)
    },
  )
})

// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { DEFAULT_BASE_PATH, resolveBasePath } from './basePath'

describe('resolveBasePath', () => {
  it('uses the planned public path by default', () => {
    expect(resolveBasePath()).toBe(DEFAULT_BASE_PATH)
    expect(DEFAULT_BASE_PATH).toBe('/game-guide/mhwilds-inventory-checker/')
  })

  it('accepts an explicit same-origin build path', () => {
    expect(resolveBasePath('/preview/inventory/')).toBe('/preview/inventory/')
  })

  it.each([
    '/missing-trailing-slash',
    'missing-leading-slash/',
    '//example.test/app/',
    '/\\example.test/app/',
    '/app/?debug=1',
    '/app/\n/',
  ])(
    'rejects invalid override %s',
    (candidate) => {
      expect(() => resolveBasePath(candidate)).toThrow()
    },
  )
})

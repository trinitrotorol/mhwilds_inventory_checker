import { resolveBasePath, resolveSimBasePath } from '../config/basePath'

export function serviceRoutes(search = globalThis.location?.search ?? '') {
  const checker = resolveBasePath(import.meta.env.BASE_URL)
  const simulator = resolveSimBasePath(import.meta.env.VITE_SIM_BASE_PATH)
  // Keep users on the old origin until they have exported their browser-local data.
  const recoveryQuery = new URLSearchParams(search).get('legacy') === '1' ? '?legacy=1' : ''
  return {
    checker: checker + recoveryQuery,
    simulator: simulator + recoveryQuery,
    catalog: simulator + 'catalog/checker-catalog.json',
  }
}

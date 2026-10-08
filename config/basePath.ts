export const DEFAULT_BASE_PATH = '/game-guide/mhwilds-inventory-checker/'
export const DEFAULT_SIM_BASE_PATH = '/game-guide/mhwilds-skill-sim/'

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0)

    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)
  })
}

export function resolveBasePath(override?: string): string {
  return resolveSameOriginPath(override, DEFAULT_BASE_PATH, 'VITE_BASE_PATH')
}

export function resolveSimBasePath(override?: string): string {
  return resolveSameOriginPath(override, DEFAULT_SIM_BASE_PATH, 'VITE_SIM_BASE_PATH')
}

function resolveSameOriginPath(override: string | undefined, fallback: string, name: string): string {
  if (override === undefined || override.trim() === '') {
    return fallback
  }

  const candidate = override.trim()

  if (!candidate.startsWith('/') || !candidate.endsWith('/')) {
    throw new Error(`${name} must start and end with "/"`)
  }

  if (
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    candidate.includes('?') ||
    candidate.includes('#') ||
    hasControlCharacter(candidate)
  ) {
    throw new Error(`${name} must be a same-origin path without query or fragment`)
  }

  return candidate
}

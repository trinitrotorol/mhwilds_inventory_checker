export const DEFAULT_BASE_PATH = '/game-guide/mhwilds-inventory-checker/'

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0)

    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)
  })
}

export function resolveBasePath(override?: string): string {
  if (override === undefined || override.trim() === '') {
    return DEFAULT_BASE_PATH
  }

  const candidate = override.trim()

  if (!candidate.startsWith('/') || !candidate.endsWith('/')) {
    throw new Error('VITE_BASE_PATH must start and end with "/"')
  }

  if (
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    candidate.includes('?') ||
    candidate.includes('#') ||
    hasControlCharacter(candidate)
  ) {
    throw new Error('VITE_BASE_PATH must be a same-origin path without query or fragment')
  }

  return candidate
}

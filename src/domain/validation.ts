import type { AppraisalCharm, CheckerCatalog, InventoryProfile, SkillLevel, Slot } from './types'

export const MAX_PROFILE_BYTES = 4 * 1024 * 1024
export const MAX_CATALOG_BYTES = 16 * 1024 * 1024
export const MAX_ENTRIES = 20_000
export class ValidationError extends Error {
  constructor(public readonly path: string, message: string) {
    super(`${path}: ${message}`)
    this.name = 'ValidationError'
  }
}
function fail(path: string, message: string): never { throw new ValidationError(path, message) }
function object(value: unknown, keys: string[], path: string, optional: string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'object required')
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) fail(path, 'plain object required')
  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) if (!keys.includes(key) && !optional.includes(key)) fail(`${path}.${key}`, 'unknown key')
  for (const key of keys) if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, 'required')
  return record
}
function array(value: unknown, path: string, max = MAX_ENTRIES, min = 0): unknown[] {
  if (!Array.isArray(value) || value.length > max || value.length < min) fail(path, `array length must be ${min}..${max}`)
  return value
}
function identifier(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length < 1 || [...value].length > 512 || value.trim() !== value || !value.trim()) fail(path, 'nonblank trimmed identifier required (max 512)')
  return value
}
function name(value: unknown, path: string): string | null {
  if (value === null) return null
  return identifier(value, path)
}
function integer(value: unknown, path: string, min = 1): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min) fail(path, `safe integer >= ${min} required`)
  return value
}
function enumeration<T extends string>(value: unknown, options: readonly T[], path: string): T {
  if (typeof value !== 'string' || !options.includes(value as T)) fail(path, 'unknown enum')
  return value as T
}
function version(value: unknown): 1 {
  if (value !== 1) fail('$.schema_version', 'unsupported schema version')
  return 1
}
export function timestamp(value: unknown, path = '$.updated_at'): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) fail(path, 'UTC ISO timestamp required')
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== (value.includes('.') ? value : value.replace('Z', '.000Z'))) fail(path, 'invalid timestamp')
  return value
}
function unique<T>(values: T[], key: (value: T) => string, path: string): T[] {
  const seen = new Set<string>()
  for (const value of values) { const id = key(value); if (seen.has(id)) fail(path, `duplicate ID ${id}`); seen.add(id) }
  return values
}
function slot(value: unknown, path: string): Slot {
  const v = object(value, ['kind', 'level'], path)
  return { kind: enumeration(v.kind, ['weapon', 'armor'], `${path}.kind`), level: integer(v.level, `${path}.level`) }
}
function slots(value: unknown, path: string, max = 4): Slot[] { return array(value, path, max).map((v, i) => slot(v, `${path}[${i}]`)) }
function skills(value: unknown, path: string, max = MAX_ENTRIES, min = 0): SkillLevel[] {
  return unique(array(value, path, max, min).map((v, i) => {
    const p = `${path}[${i}]`; const s = object(v, ['skill_id', 'level'], p)
    return { skill_id: identifier(s.skill_id, `${p}.skill_id`), level: integer(s.level, `${p}.level`) }
  }), (s) => s.skill_id, path)
}
export function parseAppraisalCharm(value: unknown, path = '$.appraisal_charm'): AppraisalCharm {
  const v = object(value, ['instance_id', 'rarity', 'skills', 'slots', 'quantity'], path, ['label'])
  const charm: AppraisalCharm = { instance_id: identifier(v.instance_id, `${path}.instance_id`), rarity: integer(v.rarity, `${path}.rarity`), skills: skills(v.skills, `${path}.skills`, 3, 1), slots: slots(v.slots, `${path}.slots`), quantity: integer(v.quantity, `${path}.quantity`, 0) }
  if (Object.hasOwn(v, 'label')) {
    if (typeof v.label !== 'string' || [...v.label].length > 200) fail(`${path}.label`, 'string of at most 200 characters required')
    charm.label = v.label
  }
  return charm
}
export function parseProfile(value: unknown): InventoryProfile {
  const v = object(value, ['schema_version', 'profile_id', 'catalog_revision', 'updated_at', 'decorations', 'fixed_charms', 'appraisal_charms'], '$')
  return {
    schema_version: version(v.schema_version), profile_id: identifier(v.profile_id, '$.profile_id'),
    catalog_revision: v.catalog_revision === null ? null : identifier(v.catalog_revision, '$.catalog_revision'), updated_at: timestamp(v.updated_at),
    decorations: unique(array(v.decorations, '$.decorations').map((x, i) => { const p = `$.decorations[${i}]`; const d = object(x, ['decoration_id', 'quantity'], p); return { decoration_id: identifier(d.decoration_id, `${p}.decoration_id`), quantity: integer(d.quantity, `${p}.quantity`, 0) } }), (d) => d.decoration_id, '$.decorations'),
    fixed_charms: unique(array(v.fixed_charms, '$.fixed_charms').map((x, i) => { const p = `$.fixed_charms[${i}]`; const d = object(x, ['equipment_id', 'quantity'], p); return { equipment_id: identifier(d.equipment_id, `${p}.equipment_id`), quantity: integer(d.quantity, `${p}.quantity`, 0) } }), (d) => d.equipment_id, '$.fixed_charms'),
    appraisal_charms: unique(array(v.appraisal_charms, '$.appraisal_charms').map((x, i) => parseAppraisalCharm(x, `$.appraisal_charms[${i}]`)), (d) => d.instance_id, '$.appraisal_charms'),
  }
}
export function parseCatalog(value: unknown): CheckerCatalog {
  const v = object(value, ['schema_version', 'revision', 'generated_at', 'skills', 'decorations', 'fixed_charms', 'appraisal_charm_skill_groups', 'appraisal_charm_patterns'], '$')
  const catalog: CheckerCatalog = {
    schema_version: version(v.schema_version), revision: identifier(v.revision, '$.revision'), generated_at: timestamp(v.generated_at, '$.generated_at'),
    skills: unique(array(v.skills, '$.skills', MAX_ENTRIES, 1).map((x, i) => {
      const p = `$.skills[${i}]`; const s = object(x, ['skill_id', 'display_name', 'kind', 'ranks'], p)
      const kind = enumeration(s.kind, ['weapon', 'armor', 'set', 'group'], `${p}.kind`)
      const ranks = array(s.ranks, `${p}.ranks`, 100, 1).map((x, i) => { const q = `${p}.ranks[${i}]`; const r = object(x, ['level', 'required_pieces'], q); const level = integer(r.level, `${q}.level`); if (level !== i + 1) fail(q, 'ranks must be consecutive from 1'); return { level, required_pieces: r.required_pieces === null ? null : integer(r.required_pieces, `${q}.required_pieces`) } })
      for (let j = 0; j < ranks.length; j++) {
        const required = ranks[j]!.required_pieces
        if (kind === 'weapon' || kind === 'armor') { if (required !== null) fail(p, 'ordinary skill must not require pieces') }
        else if (required === null || required <= (ranks[j - 1]?.required_pieces ?? 0)) fail(p, 'set/group piece thresholds must increase')
      }
      return { skill_id: identifier(s.skill_id, `${p}.skill_id`), display_name: name(s.display_name, `${p}.display_name`), kind, ranks }
    }), (s) => s.skill_id, '$.skills'),
    decorations: unique(array(v.decorations, '$.decorations', MAX_ENTRIES, 1).map((x, i) => { const p = `$.decorations[${i}]`; const d = object(x, ['decoration_id', 'display_name', 'required_slot', 'skills'], p); return { decoration_id: identifier(d.decoration_id, `${p}.decoration_id`), display_name: name(d.display_name, `${p}.display_name`), required_slot: slot(d.required_slot, `${p}.required_slot`), skills: skills(d.skills, `${p}.skills`, 100, 1) } }), (d) => d.decoration_id, '$.decorations'),
    fixed_charms: unique(array(v.fixed_charms, '$.fixed_charms', MAX_ENTRIES, 1).map((x, i) => { const p = `$.fixed_charms[${i}]`; const d = object(x, ['equipment_id', 'display_name', 'slots', 'skills'], p); return { equipment_id: identifier(d.equipment_id, `${p}.equipment_id`), display_name: name(d.display_name, `${p}.display_name`), slots: slots(d.slots, `${p}.slots`), skills: skills(d.skills, `${p}.skills`, 100) } }), (d) => d.equipment_id, '$.fixed_charms'),
    appraisal_charm_skill_groups: unique(array(v.appraisal_charm_skill_groups, '$.appraisal_charm_skill_groups').map((x, i) => { const p = `$.appraisal_charm_skill_groups[${i}]`; const d = object(x, ['group_id', 'skills'], p); return { group_id: identifier(d.group_id, `${p}.group_id`), skills: skills(d.skills, `${p}.skills`, MAX_ENTRIES, 1) } }), (d) => d.group_id, '$.appraisal_charm_skill_groups'),
    appraisal_charm_patterns: unique(array(v.appraisal_charm_patterns, '$.appraisal_charm_patterns').map((x, i) => { const p = `$.appraisal_charm_patterns[${i}]`; const d = object(x, ['pattern_id', 'rarity', 'skill_group_ids', 'slots'], p); return { pattern_id: identifier(d.pattern_id, `${p}.pattern_id`), rarity: integer(d.rarity, `${p}.rarity`), skill_group_ids: array(d.skill_group_ids, `${p}.skill_group_ids`, 3, 1).map((g) => identifier(g, `${p}.skill_group_ids`)), slots: slots(d.slots, `${p}.slots`) } }), (d) => d.pattern_id, '$.appraisal_charm_patterns'),
  }
  validateCatalogReferences(catalog)
  return catalog
}
export function validateCatalogReferences(catalog: CheckerCatalog): void {
  const known = new Map(catalog.skills.map((s) => [s.skill_id, s]))
  const check = (levels: SkillLevel[], path: string) => { for (const s of levels) { const def = known.get(s.skill_id); if (!def || !['weapon', 'armor'].includes(def.kind) || s.level > def.ranks.length) fail(path, `invalid skill reference or level: ${s.skill_id}`) } }
  for (const d of catalog.decorations) check(d.skills, '$.decorations')
  for (const d of catalog.fixed_charms) check(d.skills, '$.fixed_charms')
  for (const d of catalog.appraisal_charm_skill_groups) check(d.skills, '$.appraisal_charm_skill_groups')
  const groups = new Set(catalog.appraisal_charm_skill_groups.map((g) => g.group_id))
  for (const p of catalog.appraisal_charm_patterns) {
    if (p.skill_group_ids.some((id) => !groups.has(id))) fail('$.appraisal_charm_patterns', 'unknown group reference')
    if (!validAppraisalSlotOrder(p.slots)) fail('$.appraisal_charm_patterns', 'invalid appraisal slot kind/count/order')
  }
}
export function validAppraisalSlotOrder(slots: Slot[]): boolean {
  return slots.length <= 4 && slots.filter((s) => s.kind === 'weapon').length <= 1 && slots.filter((s) => s.kind === 'armor').length <= 3 && slots.every((s, i) => s.kind !== 'weapon' || i === 0)
}
/** Reject oversized/deep input before JSON.parse; JSON is data, never merged into prototypes. */
export function parseBoundedJson(raw: string, maxBytes = MAX_PROFILE_BYTES): unknown {
  if (new TextEncoder().encode(raw).byteLength > maxBytes) fail('$', 'file exceeds safety size limit')
  let depth = 0; let inString = false; let escaped = false
  for (const ch of raw) {
    if (inString) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') inString = false }
    else if (ch === '"') inString = true
    else if (ch === '{' || ch === '[') { if (++depth > 20) fail('$', 'JSON depth exceeds safety limit') }
    else if (ch === '}' || ch === ']') depth--
  }
  try { return JSON.parse(raw) as unknown } catch { return fail('$', 'invalid JSON') }
}

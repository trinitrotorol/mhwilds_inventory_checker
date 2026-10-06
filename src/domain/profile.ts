import type { AppraisalCharm, AppraisalValidation, CheckerCatalog, Dependencies, InventoryProfile, InventorySearchSnapshot, SkillLevel } from './types'
import { parseAppraisalCharm, parseProfile, validAppraisalSlotOrder } from './validation'

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const sortedSkills = (skills: SkillLevel[]) => skills.map((s) => ({ skill_id: s.skill_id, level: s.level })).sort((a, b) => compare(a.skill_id, b.skill_id))
export function createId(): string { return globalThis.crypto.randomUUID() }
export function createProfile(catalogRevision: string | null, dependencies: Dependencies = {}): InventoryProfile {
  return parseProfile({ schema_version: 1, profile_id: (dependencies.id ?? createId)(), catalog_revision: catalogRevision, updated_at: (dependencies.now ?? (() => new Date().toISOString()))(), decorations: [], fixed_charms: [], appraisal_charms: [] })
}
export function normalizeProfile(value: InventoryProfile): InventoryProfile {
  const profile = parseProfile(value)
  return {
    schema_version: 1, profile_id: profile.profile_id, catalog_revision: profile.catalog_revision, updated_at: profile.updated_at,
    decorations: profile.decorations.filter((d) => d.quantity > 0).sort((a, b) => compare(a.decoration_id, b.decoration_id)),
    fixed_charms: profile.fixed_charms.filter((d) => d.quantity > 0).sort((a, b) => compare(a.equipment_id, b.equipment_id)),
    appraisal_charms: profile.appraisal_charms.filter((d) => d.quantity > 0).map((d) => ({ ...d, skills: sortedSkills(d.skills) })).sort((a, b) => compare(a.instance_id, b.instance_id)),
  }
}
export function appraisalAbilities(charm: AppraisalCharm): string {
  return JSON.stringify({ rarity: charm.rarity, skills: sortedSkills(charm.skills), slots: charm.slots.map((slot) => ({ kind: slot.kind, level: slot.level })) })
}
/** A pattern selects one distinct skill per group; levels never combine across rolls. */
export function validateAppraisalCharm(value: unknown, catalog: CheckerCatalog | null): AppraisalValidation {
  let charm: AppraisalCharm
  try { charm = parseAppraisalCharm(value) } catch (error) { return { status: 'invalid', issues: [String(error)], matching_pattern_ids: [] } }
  if (!validAppraisalSlotOrder(charm.slots)) return { status: 'invalid', issues: ['武器スロットは先頭に最大1個、防具スロットは最大3個です。'], matching_pattern_ids: [] }
  if (!catalog || !catalog.appraisal_charm_skill_groups.length || !catalog.appraisal_charm_patterns.length) return { status: 'unverifiable', issues: ['鑑定護石ルールが未取得です。'], matching_pattern_ids: [] }
  const knownSkills = new Map(catalog.skills.map((s) => [s.skill_id, s]))
  const missing = charm.skills.filter((s) => !knownSkills.has(s.skill_id))
  if (missing.length) return { status: 'unverifiable', issues: missing.map((s) => `現在のカタログにないスキル: ${s.skill_id}`), matching_pattern_ids: [] }
  if (charm.skills.some((s) => !['armor', 'weapon'].includes(knownSkills.get(s.skill_id)!.kind) || s.level > knownSkills.get(s.skill_id)!.ranks.length)) return { status: 'invalid', issues: ['スキルの種別またはレベルが不正です。'], matching_pattern_ids: [] }
  const target = new Map(charm.skills.map((s) => [s.skill_id, s.level]))
  const groups = new Map(catalog.appraisal_charm_skill_groups.map((g) => [g.group_id, g.skills]))
  const matching = catalog.appraisal_charm_patterns.filter((p) => {
    if (p.rarity !== charm.rarity || p.slots.length !== charm.slots.length || p.slots.some((slot, i) => slot.kind !== charm.slots[i]!.kind || slot.level !== charm.slots[i]!.level)) return false
    if (p.skill_group_ids.length !== charm.skills.length) return false
    // At most three groups; restrict options to target IDs instead of generating
    // the potentially huge cartesian product of the whole appraisal catalog.
    const remaining = new Map(target)
    const match = (index: number): boolean => {
      if (index === p.skill_group_ids.length) return [...remaining.values()].every((n) => n === 0)
      for (const choice of groups.get(p.skill_group_ids[index]!) ?? []) {
        const rest = remaining.get(choice.skill_id) ?? 0
        if (rest !== choice.level) continue
        remaining.set(choice.skill_id, 0)
        if (match(index + 1)) return true
        remaining.set(choice.skill_id, rest)
      }
      return false
    }
    return match(0)
  }).map((p) => p.pattern_id)
  return matching.length ? { status: 'valid', issues: [], matching_pattern_ids: matching } : { status: 'invalid', issues: ['レア度・スキル・スロットの組み合わせが取得済みルールに一致しません。'], matching_pattern_ids: [] }
}
export interface ProfileIssues { catalog_mismatch: boolean; orphan_decorations: string[]; orphan_fixed_charms: string[]; appraisal_charms: { instance_id: string; validation: AppraisalValidation }[] }
export function inspectProfile(profile: InventoryProfile, catalog: CheckerCatalog): ProfileIssues {
  const decorations = new Set(catalog.decorations.map((d) => d.decoration_id))
  const fixed = new Set(catalog.fixed_charms.map((d) => d.equipment_id))
  return {
    catalog_mismatch: profile.catalog_revision !== catalog.revision,
    orphan_decorations: profile.decorations.filter((d) => !decorations.has(d.decoration_id)).map((d) => d.decoration_id),
    orphan_fixed_charms: profile.fixed_charms.filter((d) => !fixed.has(d.equipment_id)).map((d) => d.equipment_id),
    appraisal_charms: profile.appraisal_charms.map((charm) => ({ instance_id: charm.instance_id, validation: validateAppraisalCharm(charm, catalog) })).filter((entry) => entry.validation.status !== 'valid'),
  }
}
export function profileWarnings(profile: InventoryProfile, catalog: CheckerCatalog): string[] {
  const issues = inspectProfile(profile, catalog)
  return [
    ...(issues.catalog_mismatch ? ['バックアップと現在のカタログのリビジョンが異なります。'] : []),
    ...issues.orphan_decorations.map((id) => `未解決の装飾品を保持: ${id}`),
    ...issues.orphan_fixed_charms.map((id) => `未解決の固定護石を保持: ${id}`),
    ...issues.appraisal_charms.map((c) => `鑑定護石 ${c.instance_id}: ${c.validation.issues.join(' ')}`),
  ]
}
export type SearchInventoryResult = { status: 'ready'; snapshot: InventorySearchSnapshot; warnings: string[] } | { status: 'confirmation_required' | 'invalid'; snapshot: null; warnings: string[] }
/** Only explicitly accepted exclusions/revision changes can enter a search. */
export function toSearchInventory(profile: InventoryProfile, catalog: CheckerCatalog, options: { acknowledgeCatalogChange?: boolean; excludeInvalid?: boolean } = {}): SearchInventoryResult {
  profile = normalizeProfile(profile)
  const issues = inspectProfile(profile, catalog)
  const warnings = profileWarnings(profile, catalog)
  if (!/^[a-f0-9]{64}$/.test(catalog.revision)) return { status: 'invalid', snapshot: null, warnings: [...warnings, '検索にはSHA-256で識別されたカタログが必要です。'] }
  if (profile.decorations.length > 10_000 || profile.fixed_charms.length > 10_000 || profile.appraisal_charms.length > 1_000) return { status: 'invalid', snapshot: null, warnings: [...warnings, '検索用データが安全上の件数上限を超えています。所持上限を示すものではありません。'] }
  if ((issues.catalog_mismatch && !options.acknowledgeCatalogChange) || ((issues.orphan_decorations.length || issues.orphan_fixed_charms.length || issues.appraisal_charms.length) && !options.excludeInvalid)) return { status: 'confirmation_required', snapshot: null, warnings }
  const excludedDecorations = new Set(issues.orphan_decorations)
  const excludedFixed = new Set(issues.orphan_fixed_charms)
  const excludedAppraisal = new Set(issues.appraisal_charms.map((c) => c.instance_id))
  return { status: 'ready', warnings, snapshot: {
    schema_version: 1, catalog_revision: catalog.revision,
    decorations: profile.decorations.filter((d) => !excludedDecorations.has(d.decoration_id)),
    fixed_charms: profile.fixed_charms.filter((d) => !excludedFixed.has(d.equipment_id)),
    appraisal_charms: profile.appraisal_charms.filter((c) => !excludedAppraisal.has(c.instance_id)).map((c, i) => ({ instance_id: `owned:${i}`, rarity: c.rarity, skills: c.skills, slots: c.slots, quantity: c.quantity })),
  } }
}

import type { CheckerCatalog, InventoryProfile } from './types'
import { parseBoundedJson, parseProfile } from './validation'
import { appraisalAbilities, normalizeProfile, profileWarnings } from './profile'

export function exportProfile(profile: InventoryProfile): string { return `${JSON.stringify(normalizeProfile(profile), null, 2)}\n` }
export function backupFilename(profile: InventoryProfile): string { return `mhwilds-inventory-v1-${profile.updated_at.replaceAll(':', '-').replaceAll('.', '-')}.json` }
export interface ImportPreview {
  imported: InventoryProfile
  replace: InventoryProfile
  merge: InventoryProfile | null
  conflicts: string[]
  warnings: string[]
  counts: { decorations: number; fixed_charms: number; appraisal_charms: number }
  changes: { replace: number; merge: number }
}
function entries(profile: InventoryProfile): Map<string, string> {
  return new Map([
    ...profile.decorations.map((d) => [`decoration:${d.decoration_id}`, JSON.stringify(d)] as const),
    ...profile.fixed_charms.map((d) => [`fixed:${d.equipment_id}`, JSON.stringify(d)] as const),
    ...profile.appraisal_charms.map((d) => [`appraisal:${d.instance_id}`, JSON.stringify(d)] as const),
  ])
}
function changes(a: InventoryProfile, b: InventoryProfile): number {
  const before = entries(a); const after = entries(b)
  return [...new Set([...before.keys(), ...after.keys()])].filter((id) => before.get(id) !== after.get(id)).length
}
export function previewImport(raw: string, current: InventoryProfile, catalog: CheckerCatalog | null): ImportPreview {
  current = normalizeProfile(current)
  const imported = normalizeProfile(parseProfile(parseBoundedJson(raw)))
  const decorationMap = new Map(current.decorations.map((d) => [d.decoration_id, d]))
  const fixedMap = new Map(current.fixed_charms.map((d) => [d.equipment_id, d]))
  const appraisalMap = new Map(current.appraisal_charms.map((d) => [d.instance_id, d]))
  const conflicts: string[] = []
  for (const d of imported.decorations) decorationMap.set(d.decoration_id, { ...d, quantity: Math.max(d.quantity, decorationMap.get(d.decoration_id)?.quantity ?? 0) })
  for (const d of imported.fixed_charms) fixedMap.set(d.equipment_id, { ...d, quantity: Math.max(d.quantity, fixedMap.get(d.equipment_id)?.quantity ?? 0) })
  for (const charm of imported.appraisal_charms) {
    const existing = appraisalMap.get(charm.instance_id)
    if (existing && appraisalAbilities(existing) !== appraisalAbilities(charm)) { conflicts.push(charm.instance_id); continue }
    appraisalMap.set(charm.instance_id, { ...(existing ?? charm), quantity: Math.max(charm.quantity, existing?.quantity ?? 0) })
  }
  // Merge keeps the current provenance; replace restores the backed-up profile ID.
  const merged = normalizeProfile({ ...current, decorations: [...decorationMap.values()], fixed_charms: [...fixedMap.values()], appraisal_charms: [...appraisalMap.values()] })
  return {
    imported, replace: imported, merge: conflicts.length ? null : merged, conflicts,
    warnings: catalog ? profileWarnings(imported, catalog) : ['カタログ未取得のため参照・護石ルールは未検証です。'],
    counts: { decorations: imported.decorations.length, fixed_charms: imported.fixed_charms.length, appraisal_charms: imported.appraisal_charms.length },
    changes: { replace: changes(current, imported), merge: changes(current, merged) },
  }
}

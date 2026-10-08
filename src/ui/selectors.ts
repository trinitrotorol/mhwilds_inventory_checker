import type { AppraisalCharm, CheckerCatalog, InventoryProfile } from '../domain'
import type { Locale } from '../i18n/locale'
import { translate } from '../i18n/messages'

export type InventoryKind = 'decorations' | 'fixed_charms' | 'appraisal_charms'
export type OwnershipFilter = 'all' | 'owned' | 'missing'
export interface Filters { query: string; ownership: OwnershipFilter; kind: string; level: string }
export const emptyFilters: Filters = { query: '', ownership: 'all', kind: '', level: '' }
type SkillLevel = { skill_id: string; level: number }

export function itemName(name: string | null | undefined, id: string) { return name || id }
export function skillText(skills: SkillLevel[], catalog: CheckerCatalog) {
  return skills.map((skill) => `${itemName(catalog.skills.find((entry) => entry.skill_id === skill.skill_id)?.display_name, skill.skill_id)} Lv${skill.level}`).join(' / ')
}
export function slotText(slots: { kind: string; level: number }[], locale: Locale = 'ja') {
  return slots.length ? slots.map((slot) => `${translate(locale, slot.kind === 'weapon' ? '武器' : '防具')} ${slot.level}`).join(' / ') : translate(locale, 'スロットなし')
}
export function quantityFor(profile: InventoryProfile, category: 'decorations' | 'fixed_charms', id: string) {
  if (category === 'decorations') return profile.decorations.find((entry) => entry.decoration_id === id)?.quantity ?? 0
  return profile.fixed_charms.find((entry) => entry.equipment_id === id)?.quantity ?? 0
}
export function changeQuantity(profile: InventoryProfile, category: 'decorations' | 'fixed_charms', id: string, quantity: number): InventoryProfile {
  if (!Number.isSafeInteger(quantity) || quantity < 0) return profile
  if (category === 'decorations') return { ...profile, decorations: [...profile.decorations.filter((entry) => entry.decoration_id !== id), ...(quantity ? [{ decoration_id: id, quantity }] : [])] }
  return { ...profile, fixed_charms: [...profile.fixed_charms.filter((entry) => entry.equipment_id !== id), ...(quantity ? [{ equipment_id: id, quantity }] : [])] }
}
function matches(query: string, text: string, quantity: number, ownership: OwnershipFilter) {
  return text.toLocaleLowerCase('ja').includes(query.trim().toLocaleLowerCase('ja')) && (ownership === 'all' || (ownership === 'owned' ? quantity > 0 : quantity === 0))
}
export function filterDecorations(catalog: CheckerCatalog, profile: InventoryProfile, filters: Filters, alternateCatalog?: CheckerCatalog | null) {
  const aliases = new Map(alternateCatalog?.decorations.map((entry) => [entry.decoration_id, entry.display_name]))
  return catalog.decorations.filter((item) => matches(filters.query, `${item.display_name ?? ''} ${aliases.get(item.decoration_id) ?? ''} ${item.decoration_id} ${skillText(item.skills, catalog)} ${alternateCatalog ? skillText(item.skills, alternateCatalog) : ''}`, quantityFor(profile, 'decorations', item.decoration_id), filters.ownership) && (!filters.kind || item.required_slot.kind === filters.kind) && (!filters.level || item.required_slot.level === Number(filters.level))).sort((a, b) => itemName(a.display_name, a.decoration_id).localeCompare(itemName(b.display_name, b.decoration_id), 'ja') || a.decoration_id.localeCompare(b.decoration_id))
}
export function filterFixedCharms(catalog: CheckerCatalog, profile: InventoryProfile, filters: Filters, alternateCatalog?: CheckerCatalog | null) {
  const aliases = new Map(alternateCatalog?.fixed_charms.map((entry) => [entry.equipment_id, entry.display_name]))
  return catalog.fixed_charms.filter((item) => matches(filters.query, `${item.display_name ?? ''} ${aliases.get(item.equipment_id) ?? ''} ${item.equipment_id} ${skillText(item.skills, catalog)} ${alternateCatalog ? skillText(item.skills, alternateCatalog) : ''}`, quantityFor(profile, 'fixed_charms', item.equipment_id), filters.ownership) && (!filters.kind || (filters.kind === 'with' ? item.slots.length > 0 : item.slots.length === 0))).sort((a, b) => itemName(a.display_name, a.equipment_id).localeCompare(itemName(b.display_name, b.equipment_id), 'ja') || a.equipment_id.localeCompare(b.equipment_id))
}
export function filterAppraisals(catalog: CheckerCatalog, profile: InventoryProfile, query: string, alternateCatalog?: CheckerCatalog | null) {
  return profile.appraisal_charms.filter((item) => matches(query, `${item.label ?? ''} ${item.instance_id} ${skillText(item.skills, catalog)} ${alternateCatalog ? skillText(item.skills, alternateCatalog) : ''}`, item.quantity, 'all'))
}
export function inventorySummary(catalog: CheckerCatalog, profile: InventoryProfile) {
  const decorations = catalog.decorations.filter((item) => quantityFor(profile, 'decorations', item.decoration_id) > 0).length
  const fixed = catalog.fixed_charms.filter((item) => quantityFor(profile, 'fixed_charms', item.equipment_id) > 0).length
  return { decorations, fixed, decorationTotal: profile.decorations.reduce((sum, item) => sum + BigInt(item.quantity), 0n).toString(), fixedTotal: profile.fixed_charms.reduce((sum, item) => sum + BigInt(item.quantity), 0n).toString(), appraisalTotal: profile.appraisal_charms.reduce((sum, item) => sum + BigInt(item.quantity), 0n).toString() }
}
export function orphanDescriptions(catalog: CheckerCatalog, profile: InventoryProfile) {
  return [...profile.decorations.filter((item) => !catalog.decorations.some((known) => known.decoration_id === item.decoration_id)).map((item) => `装飾品 ${item.decoration_id} (${item.quantity}個)`), ...profile.fixed_charms.filter((item) => !catalog.fixed_charms.some((known) => known.equipment_id === item.equipment_id)).map((item) => `固定護石 ${item.equipment_id} (${item.quantity}個)`)]
}
export function appraisalTemplate(catalog: CheckerCatalog, patternId: string, draft: AppraisalCharm): AppraisalCharm {
  const pattern = catalog.appraisal_charm_patterns.find((item) => item.pattern_id === patternId)
  if (!pattern) return draft
  const selected: SkillLevel[] = []
  const groups = pattern.skill_group_ids.map((id) => catalog.appraisal_charm_skill_groups.find((item) => item.group_id === id)?.skills ?? [])
  function choose(index: number): boolean {
    if (index === groups.length) return true
    for (const skill of groups[index] ?? []) {
      if (selected.some((entry) => entry.skill_id === skill.skill_id)) continue
      selected.push({ ...skill })
      if (choose(index + 1)) return true
      selected.pop()
    }
    return false
  }
  choose(0)
  return { ...draft, rarity: pattern.rarity, slots: pattern.slots.map((slot) => ({ ...slot })), skills: selected }
}

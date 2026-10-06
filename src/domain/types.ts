export interface Slot { kind: 'weapon' | 'armor'; level: number }
export interface SkillLevel { skill_id: string; level: number }
export interface CatalogSkill {
  skill_id: string
  display_name: string | null
  kind: 'weapon' | 'armor' | 'set' | 'group'
  ranks: { level: number; required_pieces: number | null }[]
}
export interface CatalogDecoration {
  decoration_id: string
  display_name: string | null
  required_slot: Slot
  skills: SkillLevel[]
}
export interface FixedCharm {
  equipment_id: string
  display_name: string | null
  skills: SkillLevel[]
  slots: Slot[]
}
export interface AppraisalPattern {
  pattern_id: string
  rarity: number
  skill_group_ids: string[]
  slots: Slot[]
}
export interface CheckerCatalog {
  schema_version: 1
  revision: string
  generated_at: string
  skills: CatalogSkill[]
  decorations: CatalogDecoration[]
  fixed_charms: FixedCharm[]
  appraisal_charm_skill_groups: { group_id: string; skills: SkillLevel[] }[]
  appraisal_charm_patterns: AppraisalPattern[]
}
export interface AppraisalCharm {
  instance_id: string
  label?: string
  rarity: number
  skills: SkillLevel[]
  slots: Slot[]
  quantity: number
}
export interface InventoryProfile {
  schema_version: 1
  profile_id: string
  catalog_revision: string | null
  updated_at: string
  decorations: { decoration_id: string; quantity: number }[]
  fixed_charms: { equipment_id: string; quantity: number }[]
  appraisal_charms: AppraisalCharm[]
}
export interface InventorySearchSnapshot {
  schema_version: 1
  catalog_revision: string
  decorations: InventoryProfile['decorations']
  fixed_charms: InventoryProfile['fixed_charms']
  appraisal_charms: Omit<AppraisalCharm, 'label'>[]
}
export interface Dependencies { now?: () => string; id?: () => string }
export interface AppraisalValidation {
  status: 'valid' | 'invalid' | 'unverifiable'
  issues: string[]
  matching_pattern_ids: string[]
}

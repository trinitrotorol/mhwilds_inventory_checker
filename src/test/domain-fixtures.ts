// Small synthetic test fixture; must never be imported by production modules.
import type { AppraisalCharm, CheckerCatalog, InventoryProfile } from '../domain'

export function syntheticCatalog(): CheckerCatalog {
  return {
    schema_version: 1, revision: 'a'.repeat(64), generated_at: '2026-10-06T00:00:00.000Z',
    skills: [
      { skill_id: 'test:attack', display_name: '試験攻撃', kind: 'weapon', ranks: [{ level: 1, required_pieces: null }, { level: 2, required_pieces: null }, { level: 3, required_pieces: null }] },
      { skill_id: 'test:defense', display_name: '試験防御', kind: 'armor', ranks: [{ level: 1, required_pieces: null }, { level: 2, required_pieces: null }, { level: 3, required_pieces: null }] },
      { skill_id: 'test:set', display_name: '試験シリーズ', kind: 'set', ranks: [{ level: 1, required_pieces: 2 }, { level: 2, required_pieces: 4 }] },
    ],
    decorations: [
      { decoration_id: 'test:attack-jewel', display_name: '試験攻撃珠', required_slot: { kind: 'weapon', level: 1 }, skills: [{ skill_id: 'test:attack', level: 1 }] },
      { decoration_id: 'test:defense-jewel', display_name: null, required_slot: { kind: 'armor', level: 2 }, skills: [{ skill_id: 'test:defense', level: 1 }] },
    ],
    fixed_charms: [{ equipment_id: 'test:fixed-charm', display_name: '試験護石', skills: [{ skill_id: 'test:defense', level: 1 }], slots: [] }],
    appraisal_charm_skill_groups: [{ group_id: 'test:group', skills: [{ skill_id: 'test:attack', level: 1 }, { skill_id: 'test:defense', level: 1 }] }],
    appraisal_charm_patterns: [
      { pattern_id: 'test:pattern', rarity: 8, skill_group_ids: ['test:group', 'test:group'], slots: [{ kind: 'weapon', level: 1 }, { kind: 'armor', level: 2 }] },
      { pattern_id: 'test:equivalent-pattern', rarity: 8, skill_group_ids: ['test:group', 'test:group'], slots: [{ kind: 'weapon', level: 1 }, { kind: 'armor', level: 2 }] },
    ],
  }
}
export function syntheticAppraisal(): AppraisalCharm {
  return { instance_id: 'test:instance', label: '個人用ラベル', rarity: 8, skills: [{ skill_id: 'test:attack', level: 1 }, { skill_id: 'test:defense', level: 1 }], slots: [{ kind: 'weapon', level: 1 }, { kind: 'armor', level: 2 }], quantity: 1 }
}
export function syntheticProfile(): InventoryProfile {
  return { schema_version: 1, profile_id: 'test:profile', catalog_revision: 'a'.repeat(64), updated_at: '2026-10-06T00:00:00.000Z', decorations: [{ decoration_id: 'test:attack-jewel', quantity: 2 }], fixed_charms: [{ equipment_id: 'test:fixed-charm', quantity: 3 }], appraisal_charms: [syntheticAppraisal()] }
}

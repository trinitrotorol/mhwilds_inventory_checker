// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { validateAppraisalCharm } from '../domain'
import { syntheticAppraisal, syntheticCatalog } from '../test/domain-fixtures'
import { appraisalTemplate, changeQuantity, inventorySummary } from './selectors'
import { syntheticProfile } from '../test/domain-fixtures'

describe('inventory presentation helpers', () => {
  it('fills patterns with distinct skills and backtracks overlapping groups instead of summing duplicate choices', () => {
    const catalog = syntheticCatalog()
    catalog.appraisal_charm_skill_groups.push({ group_id: 'only-attack', skills: [{ skill_id: 'test:attack', level: 1 }] })
    catalog.appraisal_charm_patterns[0]!.skill_group_ids = ['test:group', 'only-attack']
    const charm = appraisalTemplate(catalog, 'test:pattern', syntheticAppraisal())
    expect(charm.skills).toEqual([{ skill_id: 'test:defense', level: 1 }, { skill_id: 'test:attack', level: 1 }])
    expect(validateAppraisalCharm(charm, catalog).status).toBe('valid')
  })

  it('keeps unrelated inventory and exact aggregate counts beyond a single safe integer', () => {
    const profile = changeQuantity(syntheticProfile(), 'decorations', 'test:attack-jewel', Number.MAX_SAFE_INTEGER)
    profile.decorations.push({ decoration_id: 'test:defense-jewel', quantity: Number.MAX_SAFE_INTEGER })
    expect(profile.fixed_charms).toEqual(syntheticProfile().fixed_charms)
    expect(inventorySummary(syntheticCatalog(), profile).decorationTotal).toBe('18014398509481982')
  })
})

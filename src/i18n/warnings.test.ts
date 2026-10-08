// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { localizedProfileWarnings } from './warnings'
import { syntheticCatalog, syntheticProfile } from '../test/domain-fixtures'

describe('localized import warnings', () => {
  it('translates every missing-skill issue independently and leaves IDs verbatim', () => {
    const profile = syntheticProfile()
    profile.appraisal_charms[0]!.skills = [{ skill_id: 'old:a', level: 1 }, { skill_id: 'old:b', level: 1 }]
    const original = JSON.stringify(profile)
    expect(localizedProfileWarnings(profile, syntheticCatalog(), 'en')).toEqual(['Appraisal charm test:instance: Skill missing from the current catalog: old:a Skill missing from the current catalog: old:b'])
    expect(localizedProfileWarnings(profile, syntheticCatalog(), 'ja')).toEqual(['鑑定護石 test:instance: 現在のカタログにないスキル: old:a 現在のカタログにないスキル: old:b'])
    expect(JSON.stringify(profile)).toBe(original)
  })
})

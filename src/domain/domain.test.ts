// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { appraisalAbilities, backupFilename, createProfile, exportProfile, inspectProfile, normalizeProfile, parseBoundedJson, parseCatalog, parseProfile, previewImport, toSearchInventory, validateAppraisalCharm } from './index'
import { syntheticAppraisal, syntheticCatalog, syntheticProfile } from '../test/domain-fixtures'

describe('strict profile and catalog contracts', () => {
  it('round trips canonical JSON without mutating input and omits zero records', () => {
    const input = syntheticProfile(); input.decorations.push({ decoration_id: 'orphan', quantity: 0 })
    const copy = structuredClone(input)
    const raw = exportProfile(input)
    expect(raw.endsWith('\n')).toBe(true)
    expect(parseProfile(parseBoundedJson(raw))).toEqual(normalizeProfile(input))
    expect(input).toEqual(copy)
    expect(backupFilename(input)).toMatch(/^mhwilds-inventory-v1-2026-10-06T00-00-00-000Z.json$/)
  })
  it('injects time and identity; explicitly allows an unassociated initial profile', () => {
    const profile = createProfile(null, { now: () => '2026-10-06T00:00:00Z', id: () => 'stable-id' })
    expect(profile.catalog_revision).toBeNull()
    expect(profile.profile_id).toBe('stable-id')
    expect(profile.updated_at).toBe('2026-10-06T00:00:00Z')
  })
  it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '1', null])('rejects unsafe quantity %s', (quantity) => {
    const profile = { ...syntheticProfile(), decorations: [{ decoration_id: 'test:attack-jewel', quantity }] }
    expect(() => parseProfile(profile)).toThrow()
  })
  it.each(['', ' ', ' leading', 'trailing ', '\t'])('rejects invalid IDs %s', (profile_id) => expect(() => parseProfile({ ...syntheticProfile(), profile_id })).toThrow())
  it.each(['2026-02-30T00:00:00Z', '2026-10-06', '2026-10-06T25:00:00Z', 'tomorrow'])('rejects invalid dates %s', (updated_at) => expect(() => parseProfile({ ...syntheticProfile(), updated_at })).toThrow())
  it('rejects duplicate IDs, extra keys and unsupported versions', () => {
    const profile = syntheticProfile(); profile.decorations.push({ ...profile.decorations[0]! })
    expect(() => parseProfile(profile)).toThrow(/duplicate/)
    expect(() => parseProfile({ ...syntheticProfile(), unknown: true })).toThrow(/unknown key/)
    expect(() => parseProfile({ ...syntheticProfile(), schema_version: 2 })).toThrow(/unsupported/)
    const charm = syntheticAppraisal(); charm.skills.push({ ...charm.skills[0]! })
    expect(validateAppraisalCharm(charm, syntheticCatalog()).status).toBe('invalid')
  })
  it('rejects prototype keys, deep JSON and oversize content', () => {
    const raw = JSON.stringify(syntheticProfile()).replace('"schema_version":1', '"__proto__":{"polluted":true},"schema_version":1')
    expect(() => parseProfile(parseBoundedJson(raw))).toThrow(/unknown key/)
    expect(Object.hasOwn({}, 'polluted')).toBe(false)
    expect(() => parseBoundedJson('['.repeat(21) + ']'.repeat(21))).toThrow(/depth/)
    expect(() => parseBoundedJson('日本語', 4)).toThrow(/size/)
  })
  it('validates catalog IDs, reference levels, slots, ranks and group references', () => {
    expect(parseCatalog(syntheticCatalog())).toEqual(syntheticCatalog())
    const duplicate = syntheticCatalog(); duplicate.skills.push(duplicate.skills[0]!); expect(() => parseCatalog(duplicate)).toThrow(/duplicate/)
    const missing = syntheticCatalog(); missing.decorations[0]!.skills[0]!.skill_id = 'missing'; expect(() => parseCatalog(missing)).toThrow(/reference/)
    const level = syntheticCatalog(); level.decorations[0]!.skills[0]!.level = 4; expect(() => parseCatalog(level)).toThrow(/level/)
    const group = syntheticCatalog(); group.appraisal_charm_patterns[0]!.skill_group_ids = ['missing']; expect(() => parseCatalog(group)).toThrow(/group reference/)
    const slots = syntheticCatalog(); slots.appraisal_charm_patterns[0]!.slots.reverse(); expect(() => parseCatalog(slots)).toThrow(/order/)
    const ranks = syntheticCatalog(); ranks.skills[0]!.ranks[0]!.level = 2; expect(() => parseCatalog(ranks)).toThrow(/consecutive/)
    const pieces = syntheticCatalog(); pieces.skills[2]!.ranks[1]!.required_pieces = 1; expect(() => parseCatalog(pieces)).toThrow(/thresholds/)
    expect(() => parseCatalog({ ...syntheticCatalog(), decorations: [] })).toThrow()
  })
})

describe('appraisal rules and protected historical data', () => {
  it('requires distinct choices within repeated groups and accepts multiple matching patterns', () => {
    expect(validateAppraisalCharm(syntheticAppraisal(), syntheticCatalog())).toEqual({ status: 'valid', issues: [], matching_pattern_ids: ['test:pattern', 'test:equivalent-pattern'] })
    const charm = syntheticAppraisal(); charm.skills = [{ skill_id: 'test:attack', level: 1 }, { skill_id: 'test:defense', level: 1 }]
    expect(validateAppraisalCharm(charm, syntheticCatalog()).status).toBe('valid')
    charm.skills = [{ skill_id: 'test:attack', level: 2 }]
    expect(validateAppraisalCharm(charm, syntheticCatalog()).status).toBe('invalid')
  })
  it('compares slot values independently of JSON object property insertion order', () => {
    const catalog = syntheticCatalog()
    catalog.appraisal_charm_patterns[0]!.slots = catalog.appraisal_charm_patterns[0]!.slots.map((slot) => ({ level: slot.level, kind: slot.kind }))
    expect(validateAppraisalCharm(syntheticAppraisal(), catalog).matching_pattern_ids).toHaveLength(2)
    const charm = syntheticAppraisal(); charm.slots = charm.slots.map((slot) => ({ level: slot.level, kind: slot.kind }))
    charm.skills = charm.skills.map((skill) => ({ level: skill.level, skill_id: skill.skill_id }))
    expect(appraisalAbilities(charm)).toBe(appraisalAbilities(syntheticAppraisal()))
  })
  it('distinguishes illegal rarity/levels/slot order from missing rules/skills', () => {
    const catalog = syntheticCatalog()
    expect(validateAppraisalCharm({ ...syntheticAppraisal(), rarity: 7 }, catalog).status).toBe('invalid')
    expect(validateAppraisalCharm({ ...syntheticAppraisal(), skills: [{ skill_id: 'test:attack', level: 3 }] }, catalog).status).toBe('invalid')
    expect(validateAppraisalCharm({ ...syntheticAppraisal(), skills: [{ skill_id: 'test:attack', level: 4 }] }, catalog).status).toBe('invalid')
    expect(validateAppraisalCharm({ ...syntheticAppraisal(), skills: [{ skill_id: 'test:set', level: 1 }] }, catalog).status).toBe('invalid')
    expect(validateAppraisalCharm({ ...syntheticAppraisal(), slots: [...syntheticAppraisal().slots].reverse() }, catalog).status).toBe('invalid')
    expect(validateAppraisalCharm({ ...syntheticAppraisal(), skills: [{ skill_id: 'orphan', level: 1 }] }, catalog).status).toBe('unverifiable')
    expect(validateAppraisalCharm(syntheticAppraisal(), null).status).toBe('unverifiable')
    expect(validateAppraisalCharm(syntheticAppraisal(), { ...catalog, appraisal_charm_patterns: [] }).status).toBe('unverifiable')
  })
  it('does not delete unknown records or conflate persistence with search validity', () => {
    const profile = syntheticProfile(); profile.decorations.push({ decoration_id: 'old:jewel', quantity: 5 }); profile.fixed_charms.push({ equipment_id: 'old:charm', quantity: 2 }); profile.appraisal_charms[0]!.skills[0]!.skill_id = 'old:skill'
    const restored = parseProfile(JSON.parse(exportProfile(profile)))
    const issues = inspectProfile(restored, syntheticCatalog())
    expect(issues.orphan_decorations).toEqual(['old:jewel'])
    expect(issues.orphan_fixed_charms).toEqual(['old:charm'])
    expect(issues.appraisal_charms[0]!.validation.status).toBe('unverifiable')
    expect(toSearchInventory(restored, syntheticCatalog()).status).toBe('confirmation_required')
    const accepted = toSearchInventory(restored, syntheticCatalog(), { excludeInvalid: true })
    expect(accepted.status).toBe('ready')
    expect(accepted.snapshot?.appraisal_charms).toEqual([])
    expect(restored.appraisal_charms).toHaveLength(1)
  })
  it('requires revision acknowledgment and strips every private field from snapshots', () => {
    const profile = { ...syntheticProfile(), catalog_revision: 'old-revision' }
    expect(toSearchInventory(profile, syntheticCatalog()).status).toBe('confirmation_required')
    const result = toSearchInventory(profile, syntheticCatalog(), { acknowledgeCatalogChange: true })
    expect(result.status).toBe('ready')
    expect(result.snapshot?.appraisal_charms[0]!.instance_id).toBe('owned:0')
    const json = JSON.stringify(result.snapshot)
    expect(json).not.toContain(profile.profile_id)
    expect(json).not.toContain(profile.updated_at)
    expect(json).not.toContain('個人用ラベル')
    expect(json).not.toContain('test:instance')
  })
})

describe('non-destructive backup previews', () => {
  it('merges max quantities idempotently and retains distinct instances with identical abilities', () => {
    const current = syntheticProfile(); const imported = syntheticProfile()
    imported.decorations[0]!.quantity = 5; imported.fixed_charms[0]!.quantity = 1; imported.appraisal_charms[0]!.quantity = 3
    imported.appraisal_charms.push({ ...syntheticAppraisal(), instance_id: 'different-instance' })
    const preview = previewImport(exportProfile(imported), current, syntheticCatalog())
    expect(preview.merge!.decorations[0]!.quantity).toBe(5)
    expect(preview.merge!.fixed_charms[0]!.quantity).toBe(3)
    expect(preview.merge!.appraisal_charms).toHaveLength(2)
    expect(previewImport(exportProfile(imported), preview.merge!, syntheticCatalog()).merge).toEqual(preview.merge)
    expect(current).toEqual(syntheticProfile())
  })
  it('blocks conflicting instance abilities but permits quantity/label changes and skill ordering', () => {
    const imported = syntheticProfile(); imported.appraisal_charms[0]!.rarity = 7
    const preview = previewImport(exportProfile(imported), syntheticProfile(), syntheticCatalog())
    expect(preview.conflicts).toEqual(['test:instance'])
    expect(preview.merge).toBeNull()
    expect(preview.replace).toEqual(imported)
    const labels = syntheticProfile(); labels.appraisal_charms[0]!.label = 'changed'
    expect(previewImport(exportProfile(labels), syntheticProfile(), syntheticCatalog()).merge!.appraisal_charms[0]!.label).toBe('個人用ラベル')
    expect(appraisalAbilities(syntheticAppraisal())).toBe(appraisalAbilities({ ...syntheticAppraisal(), quantity: 999, label: 'another' }))
  })
  it('preview never mutates inputs, and failed imports cannot change inventory', () => {
    const current = syntheticProfile(); const copy = structuredClone(current)
    expect(() => previewImport('{broken', current, syntheticCatalog())).toThrow()
    previewImport(exportProfile(current), current, syntheticCatalog())
    expect(current).toEqual(copy)
  })
})

/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { parseCatalog, parseProfile, toSearchInventory } from './index'
import { syntheticCatalog, syntheticProfile } from '../test/domain-fixtures'

const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const schema = (filename: string) => ajv.compile(JSON.parse(readFileSync(join(process.cwd(), 'contracts', filename), 'utf8')) as object)
const profileSchema = schema('inventory-profile.v1.schema.json')
const catalogSchema = schema('checker-catalog.v1.schema.json')
const snapshotSchema = schema('search-inventory.v1.schema.json')

describe('independent Draft 2020-12 structural parity', () => {
  it('accepts typed profile/catalog output and anonymous search snapshots', () => {
    expect(profileSchema(parseProfile(syntheticProfile())), JSON.stringify(profileSchema.errors)).toBe(true)
    expect(catalogSchema(parseCatalog(syntheticCatalog())), JSON.stringify(catalogSchema.errors)).toBe(true)
    const result = toSearchInventory(syntheticProfile(), syntheticCatalog())
    expect(result.status).toBe('ready')
    expect(snapshotSchema(result.snapshot), JSON.stringify(snapshotSchema.errors)).toBe(true)
  })
  it('shares the explicit unassociated-profile and zero/safe-quantity representation', () => {
    for (const quantity of [0, 1, Number.MAX_SAFE_INTEGER]) {
      const value = { ...syntheticProfile(), catalog_revision: null, decorations: [{ decoration_id: 'd', quantity }] }
      expect(profileSchema(value)).toBe(true)
      expect(() => parseProfile(value)).not.toThrow()
    }
  })
  it('rejects the same structural malformed profiles without relying on type assertions', () => {
    const values: unknown[] = [
      { ...syntheticProfile(), schema_version: 2 },
      { ...syntheticProfile(), profile_id: ' ' },
      { ...syntheticProfile(), extra: true },
      { ...syntheticProfile(), updated_at: '2026-02-30T00:00:00Z' },
      { ...syntheticProfile(), decorations: [{ decoration_id: 'd', quantity: Number.MAX_SAFE_INTEGER + 1 }] },
      { ...syntheticProfile(), decorations: [{ decoration_id: 'd', quantity: 0.5 }] },
      { ...syntheticProfile(), decorations: [{ decoration_id: 'd', quantity: -1 }] },
      { ...syntheticProfile(), appraisal_charms: [{ ...syntheticProfile().appraisal_charms[0], slots: [{ kind: 'invalid', level: 1 }] }] },
    ]
    for (const value of values) { expect(profileSchema(value)).toBe(false); expect(() => parseProfile(value)).toThrow() }
  })
  it('rejects the same malformed catalog shape and leaves cross-reference semantics to the domain', () => {
    const values: unknown[] = [
      { ...syntheticCatalog(), decorations: [] },
      { ...syntheticCatalog(), fixed_charms: [] },
      { ...syntheticCatalog(), revision: '\t' },
      { ...syntheticCatalog(), generated_at: 'not-a-date' },
      { ...syntheticCatalog(), skills: [{ ...syntheticCatalog().skills[0], kind: 'unknown' }] },
      { ...syntheticCatalog(), appraisal_charm_patterns: [{ ...syntheticCatalog().appraisal_charm_patterns[0], skill_group_ids: [] }] },
    ]
    for (const value of values) { expect(catalogSchema(value)).toBe(false); expect(() => parseCatalog(value)).toThrow() }
  })
  it('rejects private data, stable instance IDs, non-hash revisions and oversized snapshots', () => {
    const result = toSearchInventory(syntheticProfile(), syntheticCatalog()); const snapshot = result.snapshot!
    expect(snapshotSchema({ ...snapshot, profile_id: 'private' })).toBe(false)
    expect(snapshotSchema({ ...snapshot, catalog_revision: 'guess' })).toBe(false)
    expect(snapshotSchema({ ...snapshot, appraisal_charms: [{ ...snapshot.appraisal_charms[0], instance_id: 'private-id' }] })).toBe(false)
    expect(snapshotSchema({ ...snapshot, appraisal_charms: [{ ...snapshot.appraisal_charms[0], label: 'private' }] })).toBe(false)
    expect(snapshotSchema({ ...snapshot, appraisal_charms: Array.from({ length: 1001 }, (_, i) => ({ ...snapshot.appraisal_charms[0], instance_id: `owned:${i}` })) })).toBe(false)
    const profile = syntheticProfile(); profile.appraisal_charms = Array.from({ length: 1001 }, (_, i) => ({ ...profile.appraisal_charms[0]!, instance_id: `saved:${i}` }))
    expect(toSearchInventory(profile, syntheticCatalog()).status).toBe('invalid')
  })
})

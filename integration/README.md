# Shared inventory interface (v1)

The checker owns `contracts/*.v1.schema.json`, `src/domain/index.ts` and the
browser storage adapter. The parent simulator pins the checker Git SHA and
imports the public domain entry point, rather than React components. No
catalog data or parent dependency is bundled into this package.

## Catalog and identity

`parseCatalog(unknown)` validates the exact catalog shape, identifiers, enums,
safe integers, UTC ISO timestamps, unique IDs, skill levels and references,
ordered rank thresholds, pattern group references and appraisal slot rules.
Skills use the parent's canonical `skill_id`, `kind`, `ranks`, `display_name`
shape. A group's `skills` are choices; each pattern chooses one skill from
each listed group. Choices must have distinct skill IDs even when a group is
repeated; levels are not summed across rolls. Slots and rarity must
match the pattern exactly; several matching patterns are legal.

`revision` is separate from `schema_version`. The parent generates a SHA-256
revision from normalized source content. The checker can read other
identifiers as historical provenance, but search snapshots require a SHA-256
revision. `generated_at` and `updated_at` use UTC with seconds and optional
three-digit milliseconds (`YYYY-MM-DDTHH:mm:ss[.sss]Z`).

Schema validates structure. Runtime validation additionally rejects repeated
IDs, enforces ordered rank thresholds and checks catalog references. These
constraints cannot all be expressed in ordinary JSON Schema. Draft 2020-12
parity tests use Ajv independently of the runtime validator. Schema IDs are
identifiers, not URLs that validators should download at runtime.

## Persistence

`InventoryProfile` has explicit `catalog_revision: string | null`.
`createProfile(null)` is an unassociated profile; no synthetic revision is
invented. A profile is normalized without changing its identifiers: zero
quantity entries are omitted and IDs and skill contributions sort stably.
Unknown catalog IDs and historically invalid/unverifiable appraisal charms
remain readable and exportable. They are never silently deleted.

The only normal storage key is `mhwilds.inventory.profile.v1`. Both apps must
use `src/storage/index.ts`; neither components nor solvers directly access
localStorage. `createInventoryStore` accepts injected storage, clock, ID
generator, event target and Web Locks implementation.

`read()` returns `empty`, `ready`, `corrupt` or `unavailable` plus the raw value
where readable. `write(profile, expectedRaw)` obtains a Web Lock, rereads the
storage value, compares the exact expected raw value, validates, normalizes,
updates the timestamp and persists. No-op writes do not update timestamps.
`saved`, `conflict` and `failed` are separate outcomes. Subscribers in the same
tab are notified explicitly; `storage` events notify other tabs. Every
subscription has cleanup and `dispose()` removes any remaining listeners.

Without Web Locks, writes are serialized within this tab and use immediate
compare-and-set checks. **This fallback is not a cross-tab transaction**:
two unsupported browsers/tabs can interleave between checking and writing.
The exposed `concurrency` field identifies this limitation. All callers must
retain unsaved content and offer export after any failed/conflicting write.
Previewing an import does not reserve a write; callers preserve the preview's
`expectedRaw` and pass it to the final write.

Corrupt/unknown-version data cannot be overwritten with `write`. After
explicit user confirmation, `recover(profile, expectedRaw)` preserves the
exact existing raw data at `mhwilds.inventory.profile.v1.recovery.<UUID>` before
writing the replacement. Failure to preserve raw data prevents replacement.
Recovery values are never automatically deleted. Reset uses an explicitly
confirmed write of an empty profile, not a broad storage clear. There are no
invented migrations for past versions.

## Backups and search

`exportProfile` emits canonical pretty UTF-8 JSON with a trailing newline.
`backupFilename` includes schema version and profile timestamp. The UI owns
Blob download/revocation. Normal exports contain profile fields only.

`previewImport(raw, current, catalog)` is pure. It checks a 4 MiB UTF-8 safety
limit, depth (20), category counts (20,000), exact keys, duplicates, quantities
and timestamps, then exposes replace/merge candidates, category counts,
change counts, warnings and conflicts. No candidate is automatically saved.
Merge uses max quantities rather than adding backups. Same instance and
abilities merge with max quantity and preserve the current label. Conflicting
abilities under the same instance ID block merge; distinct IDs stay distinct.
These are defensive input limits, not game possession limits.

`toSearchInventory(profile, catalog, options)` returns `ready` with a minimal
snapshot, `confirmation_required` for catalog changes or exclusions, or
`invalid` for safety bounds. Acknowledgments use
`acknowledgeCatalogChange` and `excludeInvalid`; exclusions do not modify the
stored profile. Snapshots strip labels, profile identity and timestamps and
rename instances to `owned:<index>`. Missing decorations mean zero owned.
Snapshot category limits are 10,000 decorations, 10,000 fixed charms and
1,000 appraisal instances; overflow blocks rather than truncates the search.
The schema in `search-inventory.v1.schema.json` is consumed by both Python and
TypeScript validation in the parent. The catalog's rules, not guessed rarity
or slot caps, decide legal abilities.

The catalog loader defaults to the URL in `compatibility.json`, uses no
credentials and rejects cross-origin URLs, credentials in URLs, redirects,
bad status/content type, oversized bodies, malformed JSON and invalid data.
The 16 MiB safety limit is enforced while reading a stream. New requests
abort previous requests; old responses cannot replace the current cache.
Timeout and abort are distinct. A failed refresh retains the in-memory last
validated catalog as `stale`; a first-load failure has no catalog or fixture.

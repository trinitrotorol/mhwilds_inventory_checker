# Reference baseline

Captured on 2026-07-24 (Asia/Tokyo) for IC-001.

This document is a point-in-time engineering note, not an authoritative source
for game data, contracts, dependencies, or deployment configuration.

## Target repository

- Repository: `trinitrotorol/mhwilds_inventory_checker`
- Remote: `https://github.com/trinitrotorol/mhwilds_inventory_checker.git`
- Starting branch: `master` (unborn)
- Starting HEAD: none; the repository had no commits
- Planned integration branch: `main` (not present at capture time)
- IC-001 working branch: `task/ic-001-scaffold`

## Read-only reference repository

- Repository: `trinitrotorol/mhwilds_skill_sim`
- Default branch: `master`
- Reference HEAD: `e316fc9310a852bed822d38a7ca8a40a16251624`
- Lookup method: `git ls-remote --symref` plus public GitHub HTTPS raw and API
  reads
- Temporary cache:
  `.cache/reference-files/mhwilds_skill_sim/e316fc9310a852bed822d38a7ca8a40a16251624/`

No clone, shallow clone, fetch, submodule, or reference-repository write was
performed.

Files and metadata inspected:

- `.gitignore`
- `COMMIT_CONVENTION.md`
- `apps/web/package.json`
- `apps/web/tsconfig.app.json`
- `apps/web/eslint.config.js`
- `apps/web/README.md`
- `apps/web/src/styles.css`
- `wrangler.jsonc`
- The latest ten commit subjects returned by the public GitHub API

## Adopted decisions

- Use a small React, TypeScript, and Vite static-web foundation.
- Keep strict TypeScript checks and lockfile-based npm installation.
- Use a green-and-gold visual language, responsive behavior down to 320 px,
  and accessible markup without copying reference CSS.
- Apply the reference repository's `/game-guide/.../` production base-path
  pattern to the checker-specific path.
- Use the `type: short imperative summary` commit convention with
  checker-specific types.
- Keep shared packages in the same compatible release family. At this snapshot
  the checker uses verified patch releases Vite `8.1.5` (reference `8.1.4`) and
  typescript-eslint `8.65.0` (reference `8.64.0`).
- Pin TypeScript `6.0.3`. TypeScript 7.0 does not expose the compiler API
  required by the selected typescript-eslint integration; reevaluate the 7.x
  line when that integration is compatible without an alias workaround.

## Deliberately not adopted

- No `apps/web` monorepo layout.
- No solver, API, backend proxy, benchmark, or Playwright certification code.
- No Cloudflare Worker, `wrangler.jsonc`, deployment workflow, or secrets.
- No real game catalog, production fixture, or synthetic production fallback.
- No dependency, submodule, or copied source from the reference repository.
- No reference-repository Node setup. This repository uses its own
  repository-local `.venv`, hash-pinned nodeenv bootstrap, and a verified
  local mirror of the official Node.js archive.
- No license was inferred or added.

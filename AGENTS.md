# Repository instructions

## Scope

### Service completion scope (2026-10-06)

The current end-to-end service request supersedes the historical scope and
no-merge restrictions below. Changes to both `mhwilds_inventory_checker` and
`mhwilds_skill_sim`, real upstream catalog export, parent-to-checker submodule
integration, normal validated commits/pushes/merges and no-additional-cost
deployment are authorized. Use isolated checkouts and preserve concurrent work.
Do not enable paid infrastructure, rewrite history, bypass required checks,
expose secrets, or modify unrelated repositories/services. The checker remains
independently buildable and never depends on the parent. Environment isolation,
validation and commit conventions below remain applicable.

### Historical scaffold scope (superseded for service completion)

- Change only this `mhwilds_inventory_checker` repository.
- Treat `trinitrotorol/mhwilds_skill_sim` as read-only reference material.
- Never create commits, branches, pull requests, or configuration changes in
  `mhwilds_skill_sim`.
- Do not add `mhwilds_skill_sim` as a dependency or submodule.
- Access `mhwilds_skill_sim` only through public GitHub HTTPS read-only
  resources and `git ls-remote`.
- Never clone, shallow-clone, fetch, or add a submodule for the reference
  repository.
- Store temporary reference files only in `.cache/reference-files/`.
- Do not add real Monster Hunter Wilds catalog data. Tests may use only small,
  explicitly synthetic fixtures when a later task requires them.
- Never fall back to a synthetic fixture in a production build.

## Environment isolation

- Do not use `sudo`, an OS package manager, a global package install, or global
  Git configuration.
- Use a POSIX system Python only to create the repository-root `.venv`.
- Install the hash-pinned `nodeenv` requirement into `.venv`, then use
  `nodeenv --python-virtualenv` to install the pinned Node.js and npm versions
  into the same environment.
- Download the official Node.js archive into `.cache/`, verify its pinned
  SHA-256, and expose only that verified local mirror to nodeenv.
- Use `./scripts/bootstrap.sh` to create the pinned repository-local toolchain.
- Run Node.js through `./scripts/nodew` and npm through `./scripts/npmw`; these
  wrappers must directly invoke `.venv/bin/node` and `.venv/bin/npm`.
- Run npm through `./scripts/npmw`; do not use `npx` for implicit downloads.
- Do not use system Node.js, nvm, fnm, Volta, global pip/npm, shell rc changes,
  or a toolchain stored under `HOME`.
- Keep pip, npm, temporary, and XDG caches under `.cache/`.
- Do not commit `node_modules`, `.venv`, `.cache`, `dist`, `coverage`, `.build`,
  TypeScript build metadata, or browser-generated artifacts.

## Validation

Run the standard validation from the repository root:

```sh
./scripts/bootstrap.sh
./scripts/npmw ci
./scripts/npmw run verify
```

Do not commit while tests, lint, type checking, or the production build fail.

## Git

Follow `COMMIT_CONVENTION.md`. Use imperative commit subjects in this form:

```text
<type>: <imperative summary>
```

Do not force-push. Do not rewrite existing history, and do not amend a reviewed
commit. Keep each IC task focused and avoid unrelated refactors or dependency
updates. Do not merge task branches; leave integration decisions to the user
after review.

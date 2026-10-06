# Service plan

| Stage | Status | Evidence / next action |
| --- | --- | --- |
| S0 latest-state audit and isolation | verified | Fresh remote clones under parent's ignored `.build/service-workspaces`; original worktrees untouched |
| S1 contracts and real catalog | implemented | Versioned schemas, primary appraisal rules, source hashes |
| S2 storage / recovery / merge | verified | Domain/storage/schema tests pass |
| S3 checker UI | implemented | Japanese workflows, Digital Agency design reference; 78 tests pass |
| S4 pinned submodule and adapter | implemented | Exact pushed contract SHA pinned in parent |
| S5 owned constraints / top-K / fallback | implemented | Tiny/real cross-engine parity passes; release remote remains off |
| S6 accessibility / cost / CI / review | in_progress | Free plan confirmed; browser/a11y and CI next |
| S7 clean build / deploy / live smoke | pending | Account and existing route ownership verified |
| S8 user and operations documentation | in_progress | This directory |

The parent repository's docs/service/deployment.md and final release evidence
are authoritative for combined publication; a checker-only merge does not deploy.

# Release readiness

Checker implementation is ready for integrated release verification. Publication
is tracked in the parent repository's docs/service/ because only its fixed child
gitlink and combined build can publish this service. Remote compute is disabled.

| Check | Result |
| --- | --- |
| Parent make test / lint / data-check | lint and data-check PASS; full regression rerun in progress |
| Checker verify | 9 files / 80 tests PASS; lint, TypeScript and production build PASS |
| Integrated browser-only / owned flow | NOT_RUN |
| Independent review | domain/schema/source provenance and integration reviewed; fixes have regression tests |
| Clean tracked build and fixed child SHA | NOT_RUN |
| Cloud account and no-additional-cost verification | Workers Free current plan confirmed; remote disabled |
| Production / preview deployment | NOT_RUN |
| Public URL live smoke | NOT_RUN |

Do not treat documentation, implementation or an older green CI run as deployment
verification. Update this document with exact SHAs and observed evidence.

Local tests used VITEST_REUSE_ENV=1 because isolated jsdom workers on the Windows
mounted WSL filesystem exceeded Vitest's startup timeout. All assertions ran;
none were skipped. Default CI retains worker isolation for clean Linux validation.
The final integrated release evidence is maintained in the parent repository.

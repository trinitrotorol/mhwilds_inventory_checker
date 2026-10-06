# Cost and privacy assessment

Checked 2026-10-06. No new paid service, plan or billing account was enabled.
Remote search remains disabled in release metadata and requires an explicit
server-side gateway flag. No Cloud Run or Container deployment was dispatched.

[Cloudflare static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
states static requests and storage have no additional charge. Worker execution is
separately metered. Therefore application HTML, JavaScript, CSS and catalogs use
asset-first delivery with `_headers`; Worker-first patterns cover only explicit
slash redirects and API paths. Unknown assets remain 404, with no SPA fallback.
The user signed into Cloudflare on 2026-10-06. The dashboard confirms Workers Free
as the current $0 plan, 3,000 build minutes/month, and 0 minutes used this month.
Only the existing mhwilds-skill-sim Worker is used. It has no remote API binding
or configured runtime secrets. Its two custom routes cover only the simulator.
The production and preview workers.dev URLs are already enabled. No login secrets
were searched, copied or entered by the agent. The build commands were changed
to the repository-local pinned CLI, with versions upload on non-production
branches so review builds do not promote unverified changes to production.

[Cloud Run pricing](https://cloud.google.com/run/pricing) applies its allowance
across the billing account. Cloud Build, Artifact Registry, transfer, logging and
other attached services can have separate charges. A low maximum instance count
or frontend switch does not provide a zero-cost guarantee.
[Cloud Billing spend caps](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps)
must be checked for eligibility, coverage, latency and minimum amount; this project
has not established an applicable zero-additional-cost guard. Keep remote off.

Editing inventory, JSON import/export and browser solving do not send inventory
to a server. Optional remote search sends only conditions and anonymous inventory
constraints, with no profile ID, label, update time or backup. There is no server
inventory database, telemetry or synchronization. Public smoke tests use isolated
browser profiles and never the user's stored collection.

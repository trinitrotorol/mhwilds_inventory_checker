# Service requirements

Source: user-provided `mhwilds_service_end_to_end_codex_prompt_v3.md`, 2026-10-06.

Deliver Japanese inventory management for decorations, fixed charms and explicit
appraisal charm instances, durable local storage with protected corrupt data and
concurrent changes, canonical JSON backup preview/replace/idempotent max merge,
and same-origin simulator integration. Both engines must respect owned quantities
and valid owned charms. Browser search uses a worker, supports 1–20 equipment
candidates, cancellation and honest partial-result status. Static real catalog
data must work without remote search. Never substitute production fixtures.

The parent owns normalized game data and search; this repository owns versioned
inventory/checker schemas and DOM-free profile logic. Pin this child in the parent.
Preserve existing slot, bonus and Artian rules. No accounts, cloud inventory DB,
telemetry, OCR, payment or damage-calculation expansion.

Release requires standard tests, regression coverage, independent review,
production-equivalent browser checks and verified public URLs. Remote compute
stays disabled until zero additional cost and a fail-closed gate are established.

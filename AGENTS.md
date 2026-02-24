# Project Guidance (Codex)

## Goal
- Build a minimal, compiled TypeScript (tsc) demo proving: tag → transform → governance decision → audit log → memory echo.
- v0.1 is CLI only. No server, no UI.

## Non-negotiable invariants (MUST be enforced by code + tests)
1) CommitClass contract
   - canonical MAY update durable state / trigger irreversible actions ONLY after governance passes.
   - associative MUST NEVER update durable state or trigger irreversible actions.
   - candidate_for_canonical MUST be treated as non-canonical until explicitly promoted.

2) SemanticBasis gating
   - inferred is non-observational by default and MUST use stricter gating before any canonical acceptance.

3) Determinism enforcement
   - stochastic_replayable MUST include ReplayArtifacts (at minimum: seed and checkpoint) or be denied canonical.

4) MemoryEcho rule
   - Memory echo outputs MUST be emitted as associative (or at most candidate_for_canonical).
   - Echoes MUST NOT self-promote to canonical and MUST NOT write durable state or trigger irreversible actions.

## Scope constraints (v0.1)
- TypeScript only.
- Compiled with tsc to dist/ (no ts-node).
- Vitest for tests.
- In-memory storage only (no database, no external services).
- Exactly one routing dictionary entry: audio.salience->language.intent.v1.
- One deterministic demo scenario in src/run_demo.ts that prints the sequence described in SCOPE.md.

## Workflow rules
- Make small, reviewable changes.
- Add/adjust tests whenever you change logic related to the invariants.
- Do not add dependencies unless absolutely necessary.
- Do not introduce frameworks (no Express/Fastify/React/etc.) in v0.1.
- Keep output deterministic (stable ordering and labels).

# v0.1 Deliverable

The project must satisfy ALL of the following with no additional features:

## Commands
- `npm install` succeeds
- `npm run build` compiles TypeScript from `src/` to `dist/` using `tsc`
- `npm test` passes (Vitest)
- `npm run demo` runs compiled output via `node dist/run_demo.js`

Output must be deterministic (same ordering and labels each run).

---

## Required Demo Output Sequence

When running `npm run demo`, the console must clearly print the following sequence:

1) Emitted AUDIO.SALIENCE tag
   - CommitClass: associative
   - SemanticBasis: measured
   - Determinism: deterministic

2) Transformed LANGUAGE.INTENT_EST tag
   - CommitClass: candidate_for_canonical
   - SemanticBasis: inferred
   - Determinism: stochastic_replayable

3) Governance decision: canonical blocked
   - Reason: missing ReplayArtifacts (seed + checkpoint)

4) Governance decision: canonical promoted
   - ReplayArtifacts present
   - Replay "verification" step executed (stub allowed but explicit)

5) Audit log entry printed
   - Promotion event
   - Rule ID
   - Timestamp

6) Memory Echo query result
   - Returns associative-only echoes
   - Explicit message that echoes cannot write durable state

---

## Architectural Constraints (v0.1)

- TypeScript only
- Compiled with `tsc` (no ts-node)
- Vitest for testing
- In-memory storage only (no database, no external services)
- CLI only (no HTTP server, no UI)
- Exactly one routing dictionary entry: `audio.salience->language.intent.v1`

Do not add additional features beyond what is required to satisfy this document.

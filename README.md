# Cross-Modal Field Coupling Demo (TVS)

This repository is a minimal compiled TypeScript CLI demo that proves an end-to-end path of 
`tag -> transform -> governance decision -> audit log -> memory echo`. It enforces strict invariants around `CommitClass` behavior, semantic trust via `SemanticBasis`, deterministic governance checks for replayability requirements, and provenance capture during transformation.

The demo also shows associative memory traces and echo querying with an explicit threshold in interactive mode. Echoes remain non-canonical and non-durable by design, while deterministic ordering and clear audit output make behavior easy to inspect and verify.

## How to run

```bash
npm install
npm test
npm run demo
npm run demo:interactive
```

## What you should see

`npm run demo` prints a deterministic six-step sequence: emitted audio salience tag, transformed language intent candidate, blocked canonical decision when replay artifacts are missing, promoted canonical decision when replay artifacts are present and replay verification is executed, a promotion audit event with rule ID and timestamp, and memory-echo output that is associative-only and cannot write durable state.

`npm run demo:interactive` opens a menu for adding traces and querying echoes. Query output clearly reports either `ECHO TRIGGERED` or `NO ECHO (below threshold)` based on the top score threshold, while still showing associative-only status and that durable state writes are not allowed.

## License

This project is licensed under Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0). See [LICENSE](./LICENSE).

## Contact

- Email: putmanmodel@pm.me
- GitHub: putmanmodel

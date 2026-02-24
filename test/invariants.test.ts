// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
import { describe, expect, it } from "vitest";
import { AuditStore } from "../src/audit_store";
import { EchoMatcher } from "../src/echo_matcher";
import { MemoryTraceStore } from "../src/memory_trace_store";
import { ReceiverGovernance } from "../src/receiver_governance";
import { Tag } from "../src/types";

function baseTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: "tag-1",
    kind: "audio.salience",
    commitClass: "candidate_for_canonical",
    semanticBasis: "measured",
    determinism: "deterministic",
    provenance: ["sensor.audio.v1"],
    sensorFingerprint: { source: "mic", vector: [1, 0, 0] },
    payload: {},
    ...overrides,
  };
}

describe("AGENTS invariants", () => {
  it("associative cannot write durable state / trigger irreversible actions", () => {
    const audit = new AuditStore();
    const governance = new ReceiverGovernance(audit);

    const decision = governance.evaluate(
      {
        tag: baseTag({ commitClass: "associative" }),
        requestedCommitClass: "associative",
        durableWriteRequested: true,
      },
      "2026-01-01T00:00:00.000Z",
    );

    expect(decision.accepted).toBe(false);
    expect(decision.ruleId).toBe("R1_ASSOCIATIVE_NO_DURABLE");
  });

  it("inferred uses stricter gating than measured", () => {
    const audit = new AuditStore();
    const governance = new ReceiverGovernance(audit);

    const inferredDecision = governance.evaluate(
      {
        tag: baseTag({ semanticBasis: "inferred" }),
        requestedCommitClass: "canonical",
        replayVerified: false,
      },
      "2026-01-01T00:00:00.000Z",
    );

    const measuredDecision = governance.evaluate(
      {
        tag: baseTag({ semanticBasis: "measured" }),
        requestedCommitClass: "canonical",
        replayVerified: false,
      },
      "2026-01-01T00:00:01.000Z",
    );

    expect(inferredDecision.accepted).toBe(false);
    expect(inferredDecision.ruleId).toBe("R3_INFERRED_STRICT_GATING");
    expect(measuredDecision.accepted).toBe(true);
  });

  it("stochastic_replayable without ReplayArtifacts is denied canonical", () => {
    const audit = new AuditStore();
    const governance = new ReceiverGovernance(audit);

    const decision = governance.evaluate(
      {
        tag: baseTag({ determinism: "stochastic_replayable" }),
        requestedCommitClass: "canonical",
        replayVerified: true,
      },
      "2026-01-01T00:00:00.000Z",
    );

    expect(decision.accepted).toBe(false);
    expect(decision.ruleId).toBe("R4_REPLAY_ARTIFACTS_REQUIRED");
  });

  it("memory echoes cannot be treated as canonical even with high match score", () => {
    const memoryStore = new MemoryTraceStore();
    memoryStore.append({
      id: "trace-1",
      sourceTagId: "tag-audio",
      tagKind: "audio.salience",
      commitClass: "associative",
      sensorFingerprint: { source: "mic", vector: [1, 1, 1] },
      score: 0.99,
      note: "high confidence",
    });

    const matcher = new EchoMatcher(memoryStore);
    const echoes = matcher.queryEcho({ source: "mic", vector: [1, 1, 1] });

    const audit = new AuditStore();
    const governance = new ReceiverGovernance(audit);

    expect(echoes[0].commitClass).toBe("associative");
    expect(governance.canEchoWriteDurableState(echoes[0])).toBe(false);
  });
});

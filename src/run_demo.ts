// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
import { AuditStore } from "./audit_store";
import { EchoMatcher } from "./echo_matcher";
import { MemoryTraceStore } from "./memory_trace_store";
import { ReceiverGovernance } from "./receiver_governance";
import { TransformService } from "./transform_service";
import { AssociativeTrace, Tag } from "./types";

function printBlock(title: string, obj: unknown): void {
  console.log(`=== ${title} ===`);
  console.log(JSON.stringify(obj, null, 2));
}

function main(): void {
  const now1 = "2026-01-01T00:00:00.000Z";
  const now2 = "2026-01-01T00:00:01.000Z";
  const now3 = "2026-01-01T00:00:02.000Z";

  const auditStore = new AuditStore();
  const transformService = new TransformService(auditStore);
  const governance = new ReceiverGovernance(auditStore);
  const memoryStore = new MemoryTraceStore();
  const echoMatcher = new EchoMatcher(memoryStore);

  const audioTag: Tag = {
    id: "tag-audio-1",
    kind: "audio.salience",
    commitClass: "associative",
    semanticBasis: "measured",
    determinism: "deterministic",
    provenance: ["sensor.audio.v1"],
    sensorFingerprint: { source: "mic-array-1", vector: [0.9, 0.2, 0.1] },
    payload: { salience: 0.93 },
  };

  printBlock("STEP 1: Emitted Tag", audioTag);

  const intentCandidate = transformService.run(audioTag, now1);
  printBlock("STEP 2: Transformed Tag", intentCandidate);

  const blockedDecision = governance.evaluate(
    {
      tag: intentCandidate,
      requestedCommitClass: "canonical",
      replayVerified: true,
      durableWriteRequested: true,
    },
    now2,
  );
  printBlock("STEP 3: Governance Decision (Blocked)", {
    decision: "canonical_blocked",
    reason: blockedDecision.reason,
    ruleId: blockedDecision.ruleId,
    accepted: blockedDecision.accepted,
    resultingCommitClass: blockedDecision.resultingCommitClass,
  });

  const promotableTag: Tag = {
    ...intentCandidate,
    replayArtifacts: {
      seed: "seed-42",
      checkpoint: "ckpt-7",
    },
  };

  const promotedDecision = governance.evaluate(
    {
      tag: promotableTag,
      requestedCommitClass: "canonical",
      replayVerified: true,
      durableWriteRequested: true,
    },
    now3,
  );

  printBlock("STEP 4: Governance Decision (Promoted)", {
    decision: "canonical_promoted",
    replayArtifactsPresent: Boolean(promotableTag.replayArtifacts?.seed && promotableTag.replayArtifacts?.checkpoint),
    replayVerificationExecuted: true,
    accepted: promotedDecision.accepted,
    ruleId: promotedDecision.ruleId,
    resultingCommitClass: promotedDecision.resultingCommitClass,
  });

  const promotionAudit = auditStore.list().find((e) => e.type === "CANONICAL_PROMOTED");
  if (!promotionAudit) {
    throw new Error("missing promotion audit event");
  }
  printBlock("STEP 5: Audit Log Entry", promotionAudit);

  const trace: AssociativeTrace = {
    id: "trace-1",
    sourceTagId: audioTag.id,
    tagKind: audioTag.kind,
    commitClass: "associative",
    sensorFingerprint: audioTag.sensorFingerprint,
    score: 0.91,
    note: "baseline associative trace",
  };
  memoryStore.append(trace);

  const echoes = echoMatcher.queryEcho({ source: "mic-array-1", vector: [0.9, 0.19, 0.1] });
  const canWriteDurable = echoes.every((echo) => !governance.canEchoWriteDurableState(echo));
  if (!canWriteDurable) {
    throw new Error("echo write rule violated");
  }

  printBlock("STEP 6: Memory Echo Result", {
    echoes,
    associativeOnly: echoes.every((echo) => echo.commitClass === "associative"),
    durableStateWritesAllowed: false,
  });

  console.log("1) Emitted AUDIO.SALIENCE tag (associative, measured, deterministic)");
  console.log("2) Transformed LANGUAGE.INTENT_EST tag (candidate_for_canonical, inferred, stochastic_replayable)");
  console.log(`3) Governance decision: canonical blocked (Reason: ${blockedDecision.reason})`);
  if (promotedDecision.accepted) {
    console.log("4) Governance decision: canonical promoted (ReplayArtifacts present; replay verification executed)");
  }
  console.log(
    `5) Audit log entry printed (Promotion event, Rule ID=${promotionAudit.ruleId}, Timestamp=${promotionAudit.timestamp})`,
  );
  console.log("6) Memory Echo query result: associative-only echoes returned; echoes cannot write durable state");
}

main();

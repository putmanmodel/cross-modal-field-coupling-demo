// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
import { AuditStore } from "./audit_store";
import { MemoryEcho, Tag } from "./types";

export interface GovernanceInput {
  tag: Tag;
  requestedCommitClass: "canonical" | "associative" | "candidate_for_canonical";
  replayVerified?: boolean;
  durableWriteRequested?: boolean;
  irreversibleActionRequested?: boolean;
}

export interface GovernanceDecision {
  accepted: boolean;
  resultingCommitClass: "canonical" | "associative" | "candidate_for_canonical";
  reason: string;
  ruleId: string;
}

export class ReceiverGovernance {
  constructor(private readonly auditStore: AuditStore) {}

  evaluate(input: GovernanceInput, nowIso: string): GovernanceDecision {
    const { tag } = input;

    if (tag.commitClass === "associative" && (input.durableWriteRequested || input.irreversibleActionRequested)) {
      return this.block(tag.id, "R1_ASSOCIATIVE_NO_DURABLE", "associative cannot write durable state or trigger irreversible actions", nowIso);
    }

    if (input.requestedCommitClass !== "canonical") {
      return {
        accepted: true,
        resultingCommitClass: input.requestedCommitClass,
        reason: "non-canonical accepted",
        ruleId: "R0_NON_CANONICAL_OK",
      };
    }

    if (tag.commitClass === "associative") {
      return this.block(tag.id, "R2_ASSOCIATIVE_NEVER_CANONICAL", "associative cannot be promoted directly to canonical", nowIso);
    }

    if (tag.semanticBasis === "inferred" && !input.replayVerified) {
      return this.block(tag.id, "R3_INFERRED_STRICT_GATING", "inferred requires replay verification before canonical acceptance", nowIso);
    }

    if (tag.determinism === "stochastic_replayable") {
      if (!tag.replayArtifacts?.seed || !tag.replayArtifacts?.checkpoint) {
        return this.block(tag.id, "R4_REPLAY_ARTIFACTS_REQUIRED", "missing ReplayArtifacts (seed + checkpoint)", nowIso);
      }
      if (!input.replayVerified) {
        return this.block(tag.id, "R5_REPLAY_VERIFICATION_REQUIRED", "replay verification failed or missing", nowIso);
      }
    }

    const promotionRuleId = "R6_CANONICAL_PROMOTION";
    this.auditStore.appendPromotion(tag.id, promotionRuleId, nowIso);

    return {
      accepted: true,
      resultingCommitClass: "canonical",
      reason: "promoted",
      ruleId: promotionRuleId,
    };
  }

  canEchoWriteDurableState(_echo: MemoryEcho): boolean {
    return false;
  }

  private block(tagId: string, ruleId: string, reason: string, nowIso: string): GovernanceDecision {
    this.auditStore.append({
      id: `audit-${this.auditStore.list().length + 1}`,
      type: "GOVERNANCE_BLOCKED",
      tagId,
      ruleId,
      reason,
      timestamp: nowIso,
    });

    return {
      accepted: false,
      resultingCommitClass: "candidate_for_canonical",
      reason,
      ruleId,
    };
  }
}

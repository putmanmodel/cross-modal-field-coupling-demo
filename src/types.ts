// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
export type CommitClass = "canonical" | "associative" | "candidate_for_canonical";

export type SemanticBasis = "measured" | "inferred";

export type Determinism = "deterministic" | "stochastic_replayable";

export interface ReplayArtifacts {
  seed: string;
  checkpoint: string;
}

export interface SensorFingerprint {
  source: string;
  vector: number[];
}

export interface Tag {
  id: string;
  kind: string;
  commitClass: CommitClass;
  semanticBasis: SemanticBasis;
  determinism: Determinism;
  replayArtifacts?: ReplayArtifacts;
  provenance: string[];
  sensorFingerprint: SensorFingerprint;
  payload: Record<string, unknown>;
  score?: number;
}

export interface AssociativeTrace {
  id: string;
  sourceTagId: string;
  tagKind: string;
  commitClass: "associative";
  sensorFingerprint: SensorFingerprint;
  score: number;
  importance?: number;
  decay?: number;
  note: string;
}

export interface MemoryEcho {
  id: string;
  sourceTraceId: string;
  commitClass: "associative" | "candidate_for_canonical";
  score: number;
  note: string;
}

export interface AuditEvent {
  id: string;
  type: "TRANSFORM_EMITTED" | "GOVERNANCE_BLOCKED" | "CANONICAL_PROMOTED" | "TRACE_STORED";
  tagId: string;
  ruleId?: string;
  reason?: string;
  timestamp: string;
}

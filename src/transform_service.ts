// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
import routing from "./routing.json";
import { AuditStore } from "./audit_store";
import { Tag } from "./types";

const ROUTE_ID = "audio.salience->language.intent.v1";

export class TransformService {
  constructor(private readonly auditStore: AuditStore) {}

  run(tag: Tag, nowIso: string): Tag {
    const route = routing[ROUTE_ID as keyof typeof routing];
    if (!route || route.from !== tag.kind) {
      throw new Error("route_not_found");
    }

    const transformed: Tag = {
      id: `${tag.id}:intent`,
      kind: route.to,
      commitClass: "candidate_for_canonical",
      semanticBasis: "inferred",
      determinism: "stochastic_replayable",
      provenance: [...tag.provenance, ROUTE_ID],
      sensorFingerprint: tag.sensorFingerprint,
      payload: {
        route: ROUTE_ID,
        validation: route.validation,
      },
    };

    this.auditStore.append({
      id: `audit-${this.auditStore.list().length + 1}`,
      type: "TRANSFORM_EMITTED",
      tagId: transformed.id,
      timestamp: nowIso,
    });

    return transformed;
  }
}

// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
import { AuditEvent } from "./types";

export class AuditStore {
  private readonly events: AuditEvent[] = [];

  append(event: AuditEvent): void {
    this.events.push(event);
  }

  appendPromotion(tagId: string, ruleId: string, timestamp: string): AuditEvent {
    const event: AuditEvent = {
      id: `audit-${this.events.length + 1}`,
      type: "CANONICAL_PROMOTED",
      tagId,
      ruleId,
      timestamp,
    };
    this.events.push(event);
    return event;
  }

  list(): AuditEvent[] {
    return [...this.events];
  }
}

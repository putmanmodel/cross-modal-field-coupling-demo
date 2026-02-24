// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
import { AssociativeTrace } from "./types";

export class MemoryTraceStore {
  private readonly traces: AssociativeTrace[] = [];

  append(trace: AssociativeTrace): void {
    this.traces.push(trace);
  }

  list(): AssociativeTrace[] {
    return [...this.traces];
  }
}

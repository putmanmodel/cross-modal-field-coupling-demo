// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
import { MemoryTraceStore } from "./memory_trace_store";
import { MemoryEcho, SensorFingerprint } from "./types";

export class EchoMatcher {
  constructor(private readonly traceStore: MemoryTraceStore) {}

  queryEcho(query: SensorFingerprint): MemoryEcho[] {
    const queryScene = this.sceneFromSource(query.source);
    const matches = this.traceStore
      .list()
      .map((trace) => {
        const baseScore = this.sensorSimilarity(query.vector, trace.sensorFingerprint.vector);
        const traceScene = this.sceneFromSource(trace.sensorFingerprint.source);
        const sceneMismatch = queryScene !== null && traceScene !== null && queryScene !== traceScene;
        const score = sceneMismatch ? baseScore * 0.35 : baseScore;
        return {
          id: `echo-${trace.id}`,
          sourceTraceId: trace.id,
          commitClass: "associative" as const,
          score,
          note: `sensor-first score=${score.toFixed(3)}${sceneMismatch ? " (scene mismatch penalty)" : ""}`,
        };
      })
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

    return matches;
  }

  private sceneFromSource(source: string): string | null {
    if (!source.endsWith("-sensor")) {
      return null;
    }
    return source.slice(0, -"-sensor".length);
  }

  private sensorSimilarity(a: number[], b: number[]): number {
    const length = Math.min(a.length, b.length);
    if (length === 0) {
      return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < length; i += 1) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) {
      return 0;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

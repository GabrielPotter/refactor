export type EndpointKey = string; // pl. "GET /users/:id"

export interface EndpointStats {
  count: number;
  minMs: number;
  maxMs: number;
  avgMs: number; // Welford online average
}

export class LatencyStatsRegistry {
  private map = new Map<EndpointKey, EndpointStats>();

  update(key: EndpointKey, durationMs: number): void {
    const prev = this.map.get(key);
    if (!prev) {
      this.map.set(key, {
        count: 1,
        minMs: durationMs,
        maxMs: durationMs,
        avgMs: durationMs,
      });
      return;
    }
    const count = prev.count + 1;
    const minMs = Math.min(prev.minMs, durationMs);
    const maxMs = Math.max(prev.maxMs, durationMs);
    // Welford: newMean = oldMean + (x - oldMean) / n
    const avgMs = prev.avgMs + (durationMs - prev.avgMs) / count;

    this.map.set(key, { count, minMs, maxMs, avgMs });
  }

  snapshot(): Record<EndpointKey, EndpointStats> {
    // Produce a simple, readable JSON snapshot.
    const out: Record<string, EndpointStats> = {};
    for (const [k, v] of this.map.entries()) {
      out[k] = { ...v, avgMs: +v.avgMs.toFixed(2) };
    }
    return out;
  }

  reset(): void {
    this.map.clear();
  }
}

// Usually a singleton within the app is sufficient.
export const LatencyStats = new LatencyStatsRegistry();

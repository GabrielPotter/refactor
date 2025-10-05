import type { Request, Response, NextFunction } from "express";
import { LatencyStats } from "./latencyStats";
import { ParamGrouping } from "./paramGrouper";

const NANO_TO_MS = 1e6;

/**
 * Measures latency ONLY for route patterns that are registered via ParamGrouping.addRule.
 * All other endpoints (swagger, static, 404, etc.) are ignored.
 */
export function latencyCollector() {
  return function latencyMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    let finalized = false;

    const doFinalize = (event: "finish" | "close") => {
      if (finalized) return;
      finalized = true;

      // Decide at the very end of the response whether to record latency – by then the matched route is known.
      const aggregatedPath = ParamGrouping.matchAndAggregate(req);
      if (!aggregatedPath) {
        // Route is not allow-listed → do not measure.
        return;
      }

      const end = process.hrtime.bigint();
      const durMs = Number(end - start) / NANO_TO_MS;

      const key = `${req.method.toUpperCase()} ${aggregatedPath}`;
      LatencyStats.update(key, durMs);

      // Optional log:
      // console.info(`[LAT] ${key} -> ${res.statusCode} ${durMs.toFixed(1)} ms (${event})`);
    };

    res.once("finish", () => doFinalize("finish"));
    res.once("close",  () => doFinalize("close"));

    next();
  };
}

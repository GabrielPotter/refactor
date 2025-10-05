import type { Request } from "express";

/**
 * A rule targets an exact Express route pattern (the same string you configure on the router)
 * and tells which parameter names should keep their concrete value.
 *
 * Example:
 *   path: "/api1/tree/:id/node/:nodeid"
 *   keep: ["id"]        // only :id is kept as a concrete value, :nodeid remains a placeholder
 *   method: "GET"       // optional; when omitted the rule applies to every method
 */
export interface ParamRule {
  path: string;
  keep: string[];
  method?: string; // "GET" | "POST" | ...
}

export class ParamGrouper {
  private rules: ParamRule[] = [];

  addRule(rule: ParamRule) {
    this.rules.push({
      ...rule,
      method: rule.method ? rule.method.toUpperCase() : undefined,
    });
  }

  /**
   * Tries to find a matching allow-list rule for the current request.
   * If a rule matches, returns the aggregated path (with the selected params concrete).
   * Otherwise returns undefined to indicate no measurement.
   */
  matchAndAggregate(req: Request): string | undefined {
    const method = req.method.toUpperCase();

    // The Express route pattern is baseUrl + route.path (when available).
    const routePattern = this.getRoutePattern(req);
    if (!routePattern) {
      // 404 or not routed -> do not measure.
      return undefined;
    }

    // Only measure the paths explicitly listed in the allow-list.
    for (const r of this.rules) {
      if (r.method && r.method !== method) continue;
      if (r.path === routePattern) {
        const keepSet = new Set(r.keep);
        return this.applyAggregation(routePattern, req, keepSet);
      }
    }

    // Not present in the allow-list -> do not measure.
    return undefined;
  }

  private getRoutePattern(req: Request): string | undefined {
    const routePath = (req.baseUrl ?? "") + (typeof req.route?.path === "string" ? req.route!.path : "");
    return routePath || undefined;
  }

  private applyAggregation(pattern: string, req: Request, keepSet: Set<string>): string {
    // Replace each :param token in the pattern:
    //  - if keepSet contains it → use the concrete parameter value
    //  - otherwise keep the :param placeholder
    return pattern.replace(/:([A-Za-z0-9_]+)/g, (_m, name: string) => {
      if (keepSet.has(name)) {
        const v = (req.params as Record<string, string | undefined>)[name];
        return v ?? `:${name}`;
      }
      return `:${name}`;
    });
  }
}

export const ParamGrouping = new ParamGrouper();

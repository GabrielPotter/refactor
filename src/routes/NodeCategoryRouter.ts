import { Router, type NextFunction, type Request, type Response } from "express";
import type {
  NodeCategoryCreateInput,
  NodeCategoryRepository,
  NodeCategoryUpdateInput,
} from "../repositories/NodeCategoryRepository";

export const createNodeCategoryRouter = (repo: NodeCategoryRepository): Router => {
  const router = Router();

  const normalizeParentIds = (value: unknown): string[] | undefined => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter((candidate): candidate is string => typeof candidate === "string");
    }

    if (typeof value === "string") {
      return [value];
    }

    return undefined;
  };

  const buildCreatePayload = (body: unknown): NodeCategoryCreateInput => {
    if (!body || typeof body !== "object") {
      throw new Error("Invalid node category payload.");
    }

    const { parentIds, parent_id, props, ...rest } = body as Record<string, unknown>;
    const payload: NodeCategoryCreateInput = {
      ...(rest as NodeCategoryCreateInput),
    };

    const normalized = normalizeParentIds(parentIds ?? parent_id);
    if (normalized !== undefined) {
      payload.parentIds = normalized;
    }

    if (payload.schema === undefined && props !== undefined) {
      payload.schema = props as NodeCategoryCreateInput["schema"];
    }

    return payload;
  };

  const buildUpdatePayload = (body: unknown): NodeCategoryUpdateInput => {
    if (!body || typeof body !== "object") {
      throw new Error("Invalid node category payload.");
    }

    const { parentIds, parent_id, props, ...rest } = body as Record<string, unknown>;
    const payload: NodeCategoryUpdateInput = {
      ...(rest as NodeCategoryUpdateInput),
    };

    const normalized = normalizeParentIds(parentIds ?? parent_id);
    if (normalized !== undefined) {
      payload.parentIds = normalized;
    }

    if (payload.schema === undefined && props !== undefined) {
      payload.schema = props as NodeCategoryUpdateInput["schema"];
    }

    return payload;
  };

  router.put("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = buildCreatePayload(req.body);
      const created = await repo.create(payload);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await repo.read(req.params.id);
      if (!record) {
        res.status(404).end();
        return;
      }
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = buildUpdatePayload(req.body ?? {});
      const updated = await repo.update(req.params.id, payload);
      if (!updated) {
        res.status(404).end();
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      await repo.delete(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};

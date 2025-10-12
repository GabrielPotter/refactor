import { Router, type NextFunction, type Request, type Response } from "express";
import type { NodeTypeRepository } from "../repositories/NodeTypeRepository";

export const createNodeTypeRouter = (repo: NodeTypeRepository): Router => {
  const router = Router();

  router.put("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await repo.create(req.body);
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
      const updated = await repo.update(req.params.id, req.body ?? {});
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

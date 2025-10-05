import { Router, type NextFunction, type Request, type Response } from 'express';
import type { NodeRepository } from '../repositories/NodeRepository';

export type NodeRepositoryContract = Pick<
  NodeRepository,
  | 'listAllNodes'
  | 'createNode'
  | 'getNode'
  | 'listChildren'
  | 'updateNode'
  | 'getPathToRoot'
  | 'getSubtree'
  | 'moveSubtree'
  | 'deleteSubtree'
  | 'listByType'
  | 'incrementCounter'
>;

export const createNodeRouter = (nodeRepo: NodeRepositoryContract): Router => {
  const router = Router({ mergeParams: true });

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    const { name, parentId = null, position, props, categoryId } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const normalizedCategoryId =
        categoryId === undefined
          ? undefined
          : categoryId === null || categoryId === ''
          ? null
          : String(categoryId);

      const node = await nodeRepo.createNode({
        treeId,
        name: name.trim(),
        parentId: parentId === null || parentId === undefined ? null : String(parentId),
        position: position === undefined ? undefined : Number(position),
        props,
        categoryId: normalizedCategoryId
      });
      res.status(201).json(node);
    } catch (error) {
      next(error);
    }
  });

  router.get('/item/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    try {
      const node = await nodeRepo.getNode(treeId, nodeId);
      if (!node) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
      res.json(node);
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    const parent = req.query.parentId;
    const parentId = parent === undefined || parent === '' ? null : (parent === 'null' ? null : String(parent));
    try {
      const nodes = await nodeRepo.listChildren(treeId, parentId);
      res.json(nodes);
    } catch (error) {
      next(error);
    }
  });

  router.get('/all', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    try {
      const nodes = await nodeRepo.listAllNodes(treeId);
      res.json(nodes);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/item/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    const patch: Record<string, unknown> = req.body ?? {};
    const allowedPatch: { name?: string; position?: number; categoryId?: string | null } = {};

    if (typeof patch.name === 'string') {
      allowedPatch.name = patch.name.trim();
    }
    if (patch.position !== undefined) {
      const pos = Number(patch.position);
      if (!Number.isFinite(pos)) {
        res.status(400).json({ error: 'position must be a number' });
        return;
      }
      allowedPatch.position = pos;
    }

    if (patch.categoryId !== undefined) {
      if (patch.categoryId === null || patch.categoryId === '') {
        allowedPatch.categoryId = null;
      } else if (typeof patch.categoryId === 'string') {
        allowedPatch.categoryId = patch.categoryId;
      } else {
        allowedPatch.categoryId = String(patch.categoryId);
      }
    }

    if (!Object.keys(allowedPatch).length) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    try {
      const updated = await nodeRepo.updateNode(treeId, nodeId, allowedPatch);
      if (!updated) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.get('/item/:nodeId/path', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    try {
      const path = await nodeRepo.getPathToRoot(treeId, nodeId);
      res.json(path);
    } catch (error) {
      next(error);
    }
  });

  router.get('/item/:nodeId/subtree', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    const { maxDepth } = req.query;
    const depth = maxDepth === undefined ? undefined : Number(maxDepth);
    if (depth !== undefined && (!Number.isInteger(depth) || depth < 0)) {
      res.status(400).json({ error: 'maxDepth must be a non-negative integer' });
      return;
    }

    try {
      const subtree = await nodeRepo.getSubtree(treeId, nodeId, depth === undefined ? undefined : { maxDepth: depth });
      res.json(subtree);
    } catch (error) {
      next(error);
    }
  });

  router.post('/item/:nodeId/move', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    const { newParentId } = req.body ?? {};
    const parentId = newParentId === undefined || newParentId === null || newParentId === '' ? null : String(newParentId);

    try {
      await nodeRepo.moveSubtree(treeId, nodeId, parentId);
      res.json({ status: 'ok', action: 'move', nodeId, newParentId: parentId });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/item/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    try {
      await nodeRepo.deleteSubtree(treeId, nodeId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.get('/by-type/:type', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, type } = req.params;
    try {
      const nodes = await nodeRepo.listByType(treeId, type);
      res.json(nodes);
    } catch (error) {
      next(error);
    }
  });

  router.post('/item/:nodeId/counter', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    const { counter, delta } = req.body ?? {};
    if (typeof counter !== 'string' || !counter.trim()) {
      res.status(400).json({ error: 'counter is required' });
      return;
    }
    const increment = delta === undefined ? 1 : Number(delta);
    if (!Number.isFinite(increment)) {
      res.status(400).json({ error: 'delta must be a number' });
      return;
    }

    try {
      const result = await nodeRepo.incrementCounter(treeId, nodeId, counter.trim(), increment);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};

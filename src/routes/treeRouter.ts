import { Router, type NextFunction, type Request, type Response } from 'express';
import type { TreeRepository } from '../repositories/TreeRepository';

export type TreeRepositoryContract = Pick<
  TreeRepository,
  'createTree' | 'listTrees' | 'renameTree' | 'deleteTree'
>;

export const createTreeRouter = (treeRepo: TreeRepositoryContract): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const trees = await treeRepo.listTrees();
      res.json(trees);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const tree = await treeRepo.createTree(name.trim());
      res.status(201).json(tree);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:treeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const tree = await treeRepo.renameTree(treeId, name.trim());
      res.status(200).json(tree);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:treeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    try {
      await treeRepo.deleteTree(treeId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};

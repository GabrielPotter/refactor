import { Router, type NextFunction, type Request, type Response } from 'express';
import type { EdgeRepository } from '../repositories/EdgeRepository';

export type EdgeRepositoryContract = Pick<
  EdgeRepository,
  'listEdges' | 'listEdgesByLayer' | 'getEdge' | 'createEdge' | 'updateEdge' | 'deleteEdge'
>;

export const createEdgeRouter = (edgeRepo: EdgeRepositoryContract): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { layerId } = req.query;
      if (typeof layerId === 'string' && layerId.trim()) {
        const edges = await edgeRepo.listEdgesByLayer(layerId.trim());
        res.json(edges);
        return;
      }

      const edges = await edgeRepo.listEdges();
      res.json(edges);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:layerId', async (req: Request, res: Response, next: NextFunction) => {
    const { layerId } = req.params;
    const { name, from, to, props } = req.body ?? {};

    if (typeof layerId !== 'string' || !layerId.trim()) {
      res.status(400).json({ error: 'layerId is required' });
      return;
    }
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    if (typeof from !== 'string' || !from.trim()) {
      res.status(400).json({ error: 'from is required' });
      return;
    }
    if (typeof to !== 'string' || !to.trim()) {
      res.status(400).json({ error: 'to is required' });
      return;
    }
    if (props !== undefined && (typeof props !== 'object' || props === null || Array.isArray(props))) {
      res.status(400).json({ error: 'props must be an object if provided' });
      return;
    }

    try {
      const edge = await edgeRepo.createEdge({
        layerId: layerId.trim(),
        name: name.trim(),
        from: from.trim(),
        to: to.trim(),
        props,
      });
      res.status(201).json(edge);
    } catch (error) {
      next(error);
    }
  });

  router.get('/item/:edgeId', async (req: Request, res: Response, next: NextFunction) => {
    const { edgeId } = req.params;
    try {
      const edge = await edgeRepo.getEdge(edgeId);
      if (!edge) {
        res.status(404).json({ error: 'Edge not found' });
        return;
      }
      res.json(edge);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/item/:edgeId', async (req: Request, res: Response, next: NextFunction) => {
    const { edgeId } = req.params;
    const body: Record<string, unknown> = req.body ?? {};
    const patch: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        res.status(400).json({ error: 'name must be a string' });
        return;
      }
      const trimmed = body.name.trim();
      if (!trimmed) {
        res.status(400).json({ error: 'name cannot be empty' });
        return;
      }
      patch.name = trimmed;
    }
    if (body.layerId !== undefined) {
      if (typeof body.layerId !== 'string' || !body.layerId.trim()) {
        res.status(400).json({ error: 'layerId must be a non-empty string' });
        return;
      }
      patch.layer_id = body.layerId.trim();
    }
    if (body.from !== undefined) {
      if (typeof body.from !== 'string' || !body.from.trim()) {
        res.status(400).json({ error: 'from must be a non-empty string' });
        return;
      }
      patch.from = body.from.trim();
    }
    if (body.to !== undefined) {
      if (typeof body.to !== 'string' || !body.to.trim()) {
        res.status(400).json({ error: 'to must be a non-empty string' });
        return;
      }
      patch.to = body.to.trim();
    }
    if (body.props !== undefined) {
      if (typeof body.props !== 'object' || body.props === null || Array.isArray(body.props)) {
        res.status(400).json({ error: 'props must be an object if provided' });
        return;
      }
      patch.props = body.props;
    }

    if (!Object.keys(patch).length) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    try {
      const edge = await edgeRepo.updateEdge(edgeId, patch as any);
      if (!edge) {
        res.status(404).json({ error: 'Edge not found' });
        return;
      }
      res.json(edge);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/item/:edgeId', async (req: Request, res: Response, next: NextFunction) => {
    const { edgeId } = req.params;
    try {
      await edgeRepo.deleteEdge(edgeId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};

import { Router, type NextFunction, type Request, type Response } from 'express';
import type { LayerRepository } from '../repositories/LayerRepository';

export type LayerRepositoryContract = Pick<
  LayerRepository,
  'listLayers' | 'getLayer' | 'createLayer' | 'renameLayer' | 'deleteLayer'
>;

export const createLayerRouter = (layerRepo: LayerRepositoryContract): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const layers = await layerRepo.listLayers();
      res.json(layers);
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
      const layer = await layerRepo.createLayer(name.trim());
      res.status(201).json(layer);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:layerId', async (req: Request, res: Response, next: NextFunction) => {
    const { layerId } = req.params;
    try {
      const layer = await layerRepo.getLayer(layerId);
      if (!layer) {
        res.status(404).json({ error: 'Layer not found' });
        return;
      }
      res.json(layer);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:layerId', async (req: Request, res: Response, next: NextFunction) => {
    const { layerId } = req.params;
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const layer = await layerRepo.renameLayer(layerId, name.trim());
      res.json(layer);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:layerId', async (req: Request, res: Response, next: NextFunction) => {
    const { layerId } = req.params;
    try {
      await layerRepo.deleteLayer(layerId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};

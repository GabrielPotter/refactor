import { Router, type NextFunction, type Request, type Response } from 'express';
import { LatencyStats } from '../metrics/latencyStats';

export const createMetricsRouter = (): Router => {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json({ latency: LatencyStats.snapshot() });
  });

  router.post('/reset', (_req: Request, res: Response) => {
    LatencyStats.reset();
    res.status(204).end();
  });

  router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    // eslint-disable-next-line no-console
    console.error('Metrics router error', error);
    res.status(500).json({ error: 'Metrics router internal error' });
  });

  return router;
};

import express from 'express';
import type { Request, Response, Router } from 'express';
import { getStatus } from '../services/cache';
import { apiLogger as logger } from '../utils/logger';
import { StatusResponse, StatusSummaryResponse, StatusSummary } from '../types/api';

const router: Router = express.Router();

router.get('/:id/raw', (req: Request, res: Response<StatusResponse>) => {
  const { id } = req.params;
  logger.http(`GET /api/status/${id}/raw called`);

  const status = getStatus(id);
  if (!status) {
    logger.warn(`Status not found for server id: ${id}`);
    res.status(404).json({ error: 'Status not found or not cached' });
    return;
  }
  res.json(status);
});

router.get('/:id/raw_summary', (req: Request, res: Response<StatusSummaryResponse>) => {
  const { id } = req.params;
  logger.http(`GET /api/status/${id}/raw_summary called`);

  const status = getStatus(id)?.status;

  if (!status) {
    logger.warn(`Summary status not found or not cached for server id: ${id}`);
    res.status(404).json({ online: false, error: 'Status not found or not cached' });
    return;
  }

  const summary: StatusSummary = {
    online: true,
    description: status.description ?? null,
    version: {
      name: status.version?.name ?? null,
      protocol: status.version?.protocol ?? null,
    },
    players: {
      online: status.players?.online ?? 0,
      max: status.players?.max ?? 0,
      list: status.players?.sample ?? []
    }
  };

  res.json(summary);
});

export default router;

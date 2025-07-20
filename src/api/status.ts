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
  res.status(200).json(status);
});

router.get('/:id/summary', (req: Request, res: Response<StatusSummaryResponse>) => {
  const { id } = req.params;
  logger.http(`GET /api/status/${id}/summary called`);

  const status = getStatus(id)?.status;
  const container = getStatus(id)?.container;
  const tps = getStatus(id)?.tps;

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
    },
    players: {
      online: status.players?.online ?? 0,
      max: status.players?.max ?? 0,
      list: status.players?.sample ?? []
    },
    container: container ? {
      cpuPercent: container.cpuPercent ?? null,
      memoryUsageGB: container.memoryUsageGB ?? null,
    } : undefined,
    tps: tps ? {
      tps: tps.tps ?? 0,
      mspt: tps.mspt ?? 0,
    } : undefined,
  };

  res.status(200).json(summary);
});

export default router;

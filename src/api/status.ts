import express from 'express';
import type { Request, Response, Router } from 'express';
import { getStatus } from '../services/cache';
import { servers } from '../config';
import logger from '../utils/logger';

const router: Router = express.Router();

router.get('/:id/raw', (req: Request, res: Response) => {
  const { id } = req.params;
  logger.http(`GET /api/status/${id}/raw called`);

  const status = getStatus(id);
  if (!status) {
    logger.warn(`Status not found for server id: ${id}`);
  }
  res.json(status ? status : { error: 'Status not found or not cached' });
});

router.get('/:id/raw_summary', (req: Request, res: Response) => {
  const { id } = req.params;
  logger.http(`GET /api/status/${id}/raw_summary called`);

  const status = getStatus(id)?.data;

  if (!status) {
    logger.warn(`Summary status not found or not cached for server id: ${id}`);
  }

  const summary = status ? {
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
  } : { error: 'Status not found or not cached', online: false };

  res.json(summary);
});

router.get('/ping', (req: Request, res: Response) => {
  logger.http('GET /api/status/ping called');
  res.json({ pong: true, time: Date.now() });
});

router.get('/:id/ping', (req: Request, res: Response) => {
  const { id } = req.params;
  logger.http(`GET /api/status/${id}/ping called`);

  const server = servers.find(s => s.id === id);
  if (!server) {
    logger.warn(`Server not found for ping: id ${id}`);
    res.status(404).json({ error: 'Server not found' });
    return;
  }
  if (!server.dockerName) {
    logger.warn(`Server ${id} is not a local Docker container`);
    res.status(400).json({ error: 'Server is not a local Docker container' });
    return;
  }
  res.json({ pong: true, time: Date.now(), server: server.dockerName });
});

export default router;

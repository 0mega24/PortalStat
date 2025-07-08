import express from 'express';
import type { Request, Response, Router } from 'express';
import { servers } from '../config';
import { apiLogger as logger } from '../utils/logger';
import { PingResponse } from '../types/api';

const router: Router = express.Router();

router.get('/ping', (req: Request, res: Response<PingResponse>) => {
  logger.http('GET /api/status/ping called');
  res.json({ pong: true, time: Date.now() });
});

router.get('/:id/ping', (req: Request, res: Response<PingResponse>) => {
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
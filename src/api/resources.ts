import express from 'express';
import type { Request, Response, Router } from 'express';
import { getContainerStats } from '../services/docker';
import { servers } from '../config';
import { apiLogger as logger } from '../utils/logger';
import { ResourceUsageResponse } from '../types/api';

const router: Router = express.Router();

router.get('/:id/resource-usage', async (req: Request, res: Response<ResourceUsageResponse>) => {
  const { id } = req.params;
  logger.http(`GET /api/resources/${id}/resource-usage called`);

  const server = servers.find(s => s.id === id);
  if (!server) {
    logger.warn(`Server not found in config for id: ${id}`);
    res.status(404).json({ error: 'Server not found in config' });
    return;
  }
  if (!server.dockerName) {
    logger.warn(`Server ${id} is not a local Docker container`);
    res.status(400).json({ error: 'Server is not a local Docker container' });
    return;
  }

  try {
    const stats = await getContainerStats(server.dockerName);
    logger.info(`Successfully retrieved container stats for server ${id}`);
    res.json(stats);
  } catch (err) {
    logger.error(`Failed to get container stats for server ${id}: ${(err as Error).message}`);
    res.status(500).json({ error: 'Failed to get container stats', details: (err as Error).message });
  }
});

export default router;
import express from 'express';
import type { Request, Response, Router } from 'express';
import { getContainerStats } from '../services/docker';
import { servers } from '../config';

const router: Router = express.Router();

router.get('/:id/resource-usage', async (req: Request, res: Response) => {
  const { id } = req.params;
  const server = servers.find(s => s.id === id);
  if (!server) {
    res.status(404).json({ error: 'Server not found in config' });
    return;
  }
  if (!server.dockerName) {
    res.status(400).json({ error: 'Server is not a local Docker container' });
    return;
  }

  try {
    const stats = await getContainerStats(server.dockerName);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get container stats', details: (err as Error).message });
  }
});

export default router;
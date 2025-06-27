import express from 'express';
import type { Request, Response, Router } from 'express';
import { getStatus } from '../services/cache';
import { servers } from '../config';

const router: Router = express.Router();

router.get('/:id/raw', (req: Request, res: Response) => {
  const { id } = req.params;
  const status = getStatus(id);
  res.json(status ? status : { error: 'Status not found or not cached' });
});

router.get('/:id/raw_summary', (req: Request, res: Response) => {
  const { id } = req.params;
  const status = getStatus(id)?.data;

  const summary = status ? {
    online: status.online,
    host: status.host,
    srv_record: status.srv_record || null,
    version: {
      clean: status.version.name_clean,
      html: status.version.name_html,
      protocol: status.version.protocol,
    },
    players: {
      online: status.players?.online ?? 0,
      max: status.players?.max ?? 0,
      list: status.players?.list ?? []
    },
    motd: {
      clean: status.motd.clean,
      html: status.motd.html,
    }
  } : { error: 'Status not found or not cached' };

  res.json(summary);
});

router.get('/ping', (req: Request, res: Response) => {
  res.json({ pong: true, time: Date.now() });
});

router.get('/:id/ping', (req: Request, res: Response) => {
  const { id } = req.params;
  const server = servers.find(s => s.id === id);
  if (!server) {
    res.status(404).json({ error: 'Server not found' });
    return;
  }
  if (!server.dockerName) {
    res.status(400).json({ error: 'Server is not a local Docker container' });
    return;
  }
  res.json({ pong: true, time: Date.now(), server: server.dockerName });
});

export default router;

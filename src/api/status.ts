import express from 'express';
import type { Request, Response, Router } from 'express';
import { getStatus } from '../services/cache';

const router: Router = express.Router();

router.get('/:id/raw', (req: Request, res: Response) => {
  const id = req.params.id;
  const status = getStatus(id);
  res.send(status ? status : { error: 'Status not found or not cached' });
});

router.get('/:id/raw_summary', (req: Request, res: Response) => {
  const id = req.params.id;
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

  res.send(summary);
});

export default router;

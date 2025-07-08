import express from 'express';
import { Router, Request, Response } from 'express';
import { getStatus } from '../services/cache';
import { parseMotdToHtml } from '../utils/parseMotdToHtml';

const router: Router = express.Router();

router.get('/status/:id/description', (req: Request, res: Response) => {
  const { id } = req.params;

  const status = getStatus(id);
  if (!status) {
    return
  }

  let motd = status.status?.description;
  if (typeof motd !== 'string') {
    motd = '';
  }
  const motdHtml = parseMotdToHtml(motd);

  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <head><title>Server MOTD</title></head>
      <body style="background:#111;color:#fff;font-family:monospace;padding:2rem;">
        ${motdHtml}
      </body>
    </html>
  `);
});

export default router;

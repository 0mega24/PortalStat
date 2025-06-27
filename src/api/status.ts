import express from 'express';
import type { Request, Response, Router } from 'express';
import { getStatus } from '../services/cache';

const router: Router = express.Router();

router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const status = getStatus(id);
  res.send(status ? status : { error: 'Status not found or not cached' });
});


export default router;

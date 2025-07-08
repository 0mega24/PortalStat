import { Router, Request, Response } from "express";
import { getCache } from "../services/cache";

const router = Router();

router.get("/cache", (req: Request, res: Response) => {
  const cache = getCache();
  res.json(cache);
});

export default router;
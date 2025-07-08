import { Router, Request, Response } from "express";
import { getCache } from "../services/cache";
import { apiLogger as logger } from "../utils/logger";

const router = Router();

router.get("/cache", (req: Request, res: Response) => {
  logger.http("GET /api/cache called");
  const cache = getCache();
  res.status(200).json(cache);
});

export default router;
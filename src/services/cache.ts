import { serviceLogger as logger } from "../utils/logger";
import { MinecraftStatusResponse } from "../types/minecraft";
import { CachedStatus } from "../types/cache";
import { DockerStats } from "../types/docker";
import { RconStats } from "../types/rcon";

const statusCache: Map<string, CachedStatus> = new Map<string, CachedStatus>();

export function updateStatus(id: string, partial: Partial<CachedStatus>) {
  const prev = statusCache.get(id) ?? { status: null, container: null, tps: null, timestamp: Date.now() };
  statusCache.set(id, {
    ...prev,
    ...partial,
    timestamp: Date.now()
  });
}

export function getStatus(id: string): CachedStatus | undefined {
  if (!statusCache.has(id)) {
    logger.warn(`Status for ${id} not found in cache`);
    return undefined;
  }
  return statusCache.get(id);
}

export function getCache(): Record<string, CachedStatus> {
  return Object.fromEntries(statusCache.entries());
}